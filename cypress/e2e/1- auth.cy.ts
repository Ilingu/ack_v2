import { LoginWithCypress, LogoutWithCypress } from "../support/e2e";

describe("User Login/Logout", () => {
  it("Should Create Account", () => {
    let NavLoginBtn = null;

    // Testing Path To Go to Login Page
    cy.visit("/");
    NavLoginBtn = cy.get('[data-testid="AuthFailed"]');
    NavLoginBtn.contains("You must be signed in!");
    NavLoginBtn.click();
    cy.url().should("include", "/sign-up");

    cy.visit("/");
    NavLoginBtn = cy.get('[data-testid="Nav-Login-Btn"]');
    NavLoginBtn.contains("Get Started Now");
    NavLoginBtn.click();
    cy.url().should("include", "/sign-up");

    // Login on dev account only
    LoginWithCypress();

    cy.get('[data-testid="CreateNewUsernameInput"]')
      .type("ilingutesting")
      .should("have.value", "ilingutesting");

    cy.get('[data-testid="CreateUsernameStatusDebug"]').contains(
      "ilingutesting is available!"
    );
    cy.get('[data-testid="CreateNewUsernameBtnSubmition"]').click();

    cy.wait(2000);
    cy.contains("Already Sign-in!");
  });

  it("Should Logout", () => {
    LogoutWithCypress();
    cy.contains("Sign In/Up");

    cy.visit("/");
    cy.get('[data-testid="AuthFailed"]').contains("You must be signed in!");
    cy.get('[data-testid="Nav-Login-Btn"]').contains("Get Started Now");
  });
});
