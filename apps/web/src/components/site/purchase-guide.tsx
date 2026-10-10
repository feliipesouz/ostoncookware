import Link from "next/link";
import { useId } from "react";
import { isSafeCtaUrl } from "@/lib/safe-url";
import { ArrowUpRightIcon } from "./icons";

export type PurchaseGuideProps = {
  eyebrow: string;
  title: string;
  body: string;
  steps: { title: string; text: string }[];
  faqTitle: string;
  faqs: { question: string; answer: string }[];
  ctaLabel: string;
  ctaHref: string;
};

export function PurchaseGuide({
  eyebrow,
  title,
  body,
  steps,
  faqTitle,
  faqs,
  ctaLabel,
  ctaHref,
}: PurchaseGuideProps) {
  const id = useId();

  return (
    <section className="purchase-section" aria-labelledby={`${id}-title`}>
      <div className="site-grid">
        <div className="purchase-heading editorial-enter">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="display-title" id={`${id}-title`}>
              {title}
            </h2>
          </div>
          <div className="purchase-intro">
            <p className="editorial-copy">{body}</p>
            <Link href={isSafeCtaUrl(ctaHref) ? ctaHref : "/contato"} className="button-link">
              {ctaLabel}
              <ArrowUpRightIcon />
            </Link>
          </div>
        </div>

        <ol className="purchase-steps">
          {steps.map((step, index) => (
            <li key={`${index}-${step.title}`} className="purchase-step editorial-enter">
              <span className="purchase-step-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        {faqs.length > 0 ? (
          <section className="purchase-faq" aria-labelledby={`${id}-faq-title`}>
            <h3 id={`${id}-faq-title`}>{faqTitle}</h3>
            <div className="purchase-faq-list">
              {faqs.map((faq, index) => (
                <details
                  className="purchase-faq-item"
                  name={`${id}-faq`}
                  key={`${index}-${faq.question}`}
                >
                  <summary>
                    <span>{faq.question}</span>
                    <span className="purchase-faq-symbol" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
