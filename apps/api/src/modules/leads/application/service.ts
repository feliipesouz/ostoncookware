import {
  leadCreateSchema,
  leadListQuerySchema,
  leadNoteCreateSchema,
  leadStatusSchema,
  leadUpdateSchema,
  type SessionUser,
} from "@oston/contracts";
import { Prisma, prisma } from "@oston/database";
import { HttpError } from "../../../lib/errors.js";
import { toCsv } from "../../../lib/csv.js";
import { firstName, normalizeEmail, normalizePhoneDigits } from "../../../lib/names.js";
import { toPage } from "../../../lib/pagination.js";

const crm = prisma as typeof prisma & {
  leadNote: {
    create: (args: {
      data: { leadId: string; authorId?: string | null; content: string };
      include?: { author: { select: { id: true; name: true; email: true } } };
    }) => Promise<LeadNoteRow>;
    findMany: (args: unknown) => Promise<LeadNoteRow[]>;
  };
  leadActivity: {
    create: (args: {
      data: {
        leadId: string;
        actorId?: string | null;
        type: string;
        message: string;
        metadata?: Prisma.InputJsonValue;
      };
    }) => Promise<LeadActivityRow>;
    findMany: (args: unknown) => Promise<LeadActivityRow[]>;
  };
};

type AssignedUser = { id: string; name: string; email: string } | null;

type LeadNoteRow = {
  id: string;
  leadId: string;
  authorId: string | null;
  content: string;
  createdAt: Date;
  author?: AssignedUser;
};

type LeadActivityRow = {
  id: string;
  leadId: string;
  actorId: string | null;
  type: string;
  message: string;
  metadata: unknown;
  createdAt: Date;
  actor?: AssignedUser;
};

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string | null;
  state: string | null;
  interest: "COLLECTION" | "CONSULTANT" | "CATALOG" | "OTHER";
  collectionId: string | null;
  collection: { name: string } | null;
  message: string | null;
  source: string | null;
  landingPage: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";
  notes: string | LeadNoteRow[] | null;
  createdAt: Date;
  updatedAt: Date;
  assignedToId?: string | null;
  assignedTo?: AssignedUser;
  emailNormalized?: string | null;
  phoneNormalized?: string | null;
  tags?: string[];
};

const leadInclude = {
  collection: true,
  assignedTo: { select: { id: true, name: true, email: true } },
} as const;

export function normalizeLeadPhone(phone: string) {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 10 || digits.length > 15) {
    throw new HttpError(400, "Informe um telefone válido.", { code: "INVALID_PHONE" });
  }
  return digits;
}

export function statusChangeMessage(actorName: string, from: string, to: string) {
  return `${firstName(actorName)} alterou ${from} → ${to}`;
}

export function assignmentMessage(actorName: string, assigneeName: string | null) {
  if (!assigneeName) {
    return `${firstName(actorName)} removeu o responsável`;
  }
  return `${firstName(actorName)} atribuiu o lead a ${assigneeName}`;
}

export function noteAddedMessage(actorName: string) {
  return `${firstName(actorName)} adicionou uma nota`;
}

export function findDuplicateCandidates(
  current: { id: string; phoneNormalized?: string | null; emailNormalized?: string | null },
  others: Array<{ id: string; name: string; phone: string; email: string | null; createdAt: Date; phoneNormalized?: string | null; emailNormalized?: string | null }>,
) {
  return others.filter((row) => {
    if (row.id === current.id) {
      return false;
    }
    const phoneMatch = Boolean(current.phoneNormalized && row.phoneNormalized === current.phoneNormalized);
    const emailMatch = Boolean(current.emailNormalized && row.emailNormalized === current.emailNormalized);
    return phoneMatch || emailMatch;
  });
}

function parseDateBound(value: string | undefined, endOfDay: boolean) {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "Data inválida.", { code: "INVALID_DATE" });
  }
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    parsed.setUTCHours(23, 59, 59, 999);
  }
  return parsed;
}

function leadWhere(query: ReturnType<typeof leadListQuerySchema.parse>): Prisma.LeadWhereInput {
  const from = parseDateBound(query.from, false);
  const to = parseDateBound(query.to, true);
  const extra: Record<string, unknown> = {};

  if (query.assignedToId) extra.assignedToId = query.assignedToId;
  if (query.source) extra.source = { equals: query.source, mode: "insensitive" };
  if (query.utmCampaign) extra.utmCampaign = { equals: query.utmCampaign, mode: "insensitive" };
  if (query.collectionId) extra.collectionId = query.collectionId;
  if (query.interest) extra.interest = query.interest;

  const search = query.q
    ? {
        OR: [
          { name: { contains: query.q, mode: "insensitive" as const } },
          { email: { contains: query.q, mode: "insensitive" as const } },
          { phone: { contains: query.q } },
          { emailNormalized: { contains: query.q.toLowerCase() } },
          { phoneNormalized: { contains: normalizePhoneDigits(query.q) || query.q } },
        ],
      }
    : {};

  return {
    status: query.status,
    createdAt: from || to ? { gte: from, lte: to } : undefined,
    ...extra,
    ...search,
  } as Prisma.LeadWhereInput;
}

async function writeActivity(input: {
  leadId: string;
  actorId?: string | null;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  await crm.leadActivity.create({
    data: {
      leadId: input.leadId,
      actorId: input.actorId ?? null,
      type: input.type,
      message: input.message,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createLead(input: unknown) {
  const data = leadCreateSchema.parse(input);

  if (data.website && data.website.trim().length > 0) {
    return { ignored: true as const };
  }

  const phoneNormalized = normalizeLeadPhone(data.phone);
  const email = data.email && data.email.length > 0 ? data.email : null;
  const emailNormalized = normalizeEmail(email);

  const lead = await crm.lead.create({
    data: {
      name: data.name.trim(),
      email,
      phone: phoneNormalized,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      interest: data.interest,
      collectionId: data.collectionId || null,
      message: data.message?.trim() || null,
      source: data.source || "website",
      landingPage: data.landingPage || null,
      utmSource: data.utmSource || null,
      utmMedium: data.utmMedium || null,
      utmCampaign: data.utmCampaign || null,
      utmContent: data.utmContent || null,
      emailNormalized,
      phoneNormalized,
      tags: [],
    } as never,
    include: leadInclude as never,
  });

  await writeActivity({
    leadId: lead.id,
    type: "CREATED",
    message: "Lead criado pelo site",
    metadata: { source: data.source || "website" },
  });

  return { ignored: false as const, lead: lead as LeadRow };
}

const leadSortFields = {
  createdAt: "createdAt",
  status: "status",
} as const;

export async function listLeads(query: unknown) {
  const parsed = leadListQuerySchema.parse(query);
  const sortKey =
    parsed.sort && parsed.sort in leadSortFields ? (parsed.sort as keyof typeof leadSortFields) : "createdAt";
  const order = parsed.order === "asc" ? "asc" : "desc";
  const where = leadWhere(parsed);

  const [rows, total] = await prisma.$transaction([
    crm.lead.findMany({
      where,
      include: leadInclude as never,
      orderBy: [{ [leadSortFields[sortKey]]: order }, { id: "desc" }],
      skip: (parsed.page - 1) * parsed.pageSize,
      take: parsed.pageSize,
    }),
    crm.lead.count({ where }),
  ]);

  return toPage((rows as LeadRow[]).map(mapLead), total, parsed.page, parsed.pageSize);
}

export async function getLeadById(id: string) {
  const lead = (await crm.lead.findUnique({
    where: { id },
    include: leadInclude as never,
  })) as LeadRow | null;

  if (!lead) {
    throw new HttpError(404, "Lead não encontrado.", { code: "NOT_FOUND" });
  }

  const [notes, activities, possibleDuplicates] = await Promise.all([
    crm.leadNote.findMany({
      where: { leadId: id },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    crm.leadActivity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "asc" },
    }),
    findPossibleDuplicates(lead),
  ]);

  return {
    ...mapLead(lead),
    notes: notes.map(mapNote),
    activities: activities.map(mapActivity),
    possibleDuplicates,
  };
}

export async function findPossibleDuplicates(lead: {
  id: string;
  phoneNormalized?: string | null;
  emailNormalized?: string | null;
  phone?: string;
  email?: string | null;
}) {
  const phoneNormalized = lead.phoneNormalized ?? (lead.phone ? normalizePhoneDigits(lead.phone) : null);
  const emailNormalized = lead.emailNormalized ?? normalizeEmail(lead.email);
  const or: Prisma.LeadWhereInput[] = [];
  if (phoneNormalized) {
    or.push({ phoneNormalized } as Prisma.LeadWhereInput, { phone: phoneNormalized });
  }
  if (emailNormalized) {
    or.push({ emailNormalized } as Prisma.LeadWhereInput, { email: { equals: emailNormalized, mode: "insensitive" } });
  }
  if (or.length === 0) {
    return [];
  }

  const rows = (await crm.lead.findMany({
    where: {
      id: { not: lead.id },
      OR: or,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      createdAt: true,
      phoneNormalized: true,
      emailNormalized: true,
    } as never,
    take: 20,
    orderBy: { createdAt: "desc" },
  })) as Array<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    createdAt: Date;
    phoneNormalized?: string | null;
    emailNormalized?: string | null;
  }>;

  return findDuplicateCandidates({ id: lead.id, phoneNormalized, emailNormalized }, rows).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    createdAt: row.createdAt,
  }));
}

export async function updateLead(id: string, input: unknown, actor: SessionUser) {
  const data = leadUpdateSchema.parse(input);
  const existing = (await crm.lead.findUnique({
    where: { id },
    include: leadInclude as never,
  })) as LeadRow | null;

  if (!existing) {
    throw new HttpError(404, "Lead não encontrado.", { code: "NOT_FOUND" });
  }

  let assignee: AssignedUser = existing.assignedTo ?? null;
  if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) {
    if (data.assignedToId) {
      const user = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { id: true, name: true, email: true },
      });
      if (!user) {
        throw new HttpError(400, "Responsável não encontrado.", { code: "INVALID_ASSIGNEE" });
      }
      assignee = user;
    } else {
      assignee = null;
    }
  }

  const updated = (await crm.lead.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
    } as never,
    include: leadInclude as never,
  })) as LeadRow;

  if (data.status !== undefined && data.status !== existing.status) {
    await writeActivity({
      leadId: id,
      actorId: actor.id,
      type: "STATUS_CHANGE",
      message: statusChangeMessage(actor.name, existing.status, data.status),
      metadata: { from: existing.status, to: data.status },
    });
  }

  if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) {
    await writeActivity({
      leadId: id,
      actorId: actor.id,
      type: "ASSIGNED",
      message: assignmentMessage(actor.name, assignee?.name ?? null),
      metadata: { assignedToId: data.assignedToId, assignedToName: assignee?.name ?? null },
    });
  }

  if (data.tags !== undefined) {
    await writeActivity({
      leadId: id,
      actorId: actor.id,
      type: "UPDATED",
      message: `${firstName(actor.name)} atualizou as tags`,
      metadata: { tags: data.tags },
    });
  }

  return {
    lead: updated,
    statusChanged: data.status !== undefined && data.status !== existing.status,
    assignedChanged: data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId,
    previousStatus: existing.status,
  };
}

export async function addLeadNote(id: string, input: unknown, actor: SessionUser) {
  const data = leadNoteCreateSchema.parse(input);
  const existing = await crm.lead.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new HttpError(404, "Lead não encontrado.", { code: "NOT_FOUND" });
  }

  const note = await crm.leadNote.create({
    data: {
      leadId: id,
      authorId: actor.id,
      content: data.content,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  await writeActivity({
    leadId: id,
    actorId: actor.id,
    type: "NOTE_ADDED",
    message: noteAddedMessage(actor.name),
  });

  return mapNote(note);
}

export async function exportLeadsCsv(query: unknown) {
  const parsed = leadListQuerySchema.parse(query);
  const where = leadWhere({ ...parsed, page: 1, pageSize: 50 });
  const rows = (await crm.lead.findMany({
    where,
    include: leadInclude as never,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 10_000,
  })) as LeadRow[];

  const headers = [
    "id",
    "name",
    "email",
    "phone",
    "city",
    "state",
    "interest",
    "collection",
    "source",
    "status",
    "assignedTo",
    "tags",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmContent",
    "createdAt",
  ];

  return toCsv(
    headers,
    rows.map((row) => [
      row.id,
      row.name,
      row.email,
      row.phone,
      row.city,
      row.state,
      row.interest,
      row.collection?.name ?? "",
      row.source,
      row.status,
      row.assignedTo?.name ?? "",
      (row.tags ?? []).join("|"),
      row.utmSource,
      row.utmMedium,
      row.utmCampaign,
      row.utmContent,
      row.createdAt.toISOString(),
    ]),
  );
}

export function mapNote(row: LeadNoteRow) {
  return {
    id: row.id,
    leadId: row.leadId,
    authorId: row.authorId,
    authorName: row.author?.name ?? null,
    content: row.content,
    createdAt: row.createdAt,
  };
}

export function mapActivity(row: LeadActivityRow) {
  return {
    id: row.id,
    leadId: row.leadId,
    actorId: row.actorId,
    actorName: row.actor?.name ?? null,
    type: row.type,
    message: row.message,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

export function mapLead(row: LeadRow) {
  const legacyNotes = typeof row.notes === "string" ? row.notes : null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    state: row.state,
    interest: row.interest,
    collectionId: row.collectionId,
    collectionName: row.collection?.name ?? null,
    message: row.message,
    source: row.source,
    landingPage: row.landingPage,
    utmSource: row.utmSource,
    utmMedium: row.utmMedium,
    utmCampaign: row.utmCampaign,
    utmContent: row.utmContent,
    status: row.status,
    notes: legacyNotes,
    assignedToId: row.assignedToId ?? null,
    assignedTo: row.assignedTo
      ? { id: row.assignedTo.id, name: row.assignedTo.name, email: row.assignedTo.email }
      : null,
    tags: row.tags ?? [],
    emailNormalized: row.emailNormalized ?? normalizeEmail(row.email),
    phoneNormalized: row.phoneNormalized ?? normalizePhoneDigits(row.phone),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export { leadStatusSchema };
