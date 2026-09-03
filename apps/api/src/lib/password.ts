const MIN_PASSWORD_LENGTH = 12;
const PASSWORD_COMPLEXITY = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export function assertBootstrapPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH || !PASSWORD_COMPLEXITY.test(password)) {
    throw new Error(
      `ADMIN_PASSWORD deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres, com letras e números.`,
    );
  }
}
