export const LoginWithCypress = () => {
  cy.visit("/sign-up");
  cy.contains("Sign In/Up");
  cy.get('[data-testid="LoginWithGithub"]').click();
  cy.wait(1000);
};

export const LogoutWithCypress = () => {
  cy.visit("/sign-up");
  cy.contains("Already Sign-in!");
  cy.get('[data-testid="SignOutLoginPage"]').click();
};

describe("User Login/Logout", () => {
  it("Should Login", () => {
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

    cy.wait(1000);
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

describe("User Interaction", () => {
  const RenameUsername = (NewUsername: string) => {
    cy.visit("/settings");
    cy.get('[data-testid="RenameUsernameInput"]')
      .type(`{selectAll}{backspace}${NewUsername}`)
      .should("have.value", NewUsername);

    cy.get('[data-testid="RenameUsernameBtnSubmition"]').click();
    cy.get('[data-testid="UserUsername"]').contains(NewUsername);
  };

  it("Rename Username", () => {
    LoginWithCypress();

    RenameUsername("ilingutest"); // Change
    RenameUsername("ilingutesting"); // Back to normal
  });

  it("Delete User", () => {
    cy.visit("/settings");
    cy.get('[data-testid="DeleteUserBtn"]').dblclick();
    cy.wait(11000);

    cy.visit("/");
    cy.get('[data-testid="AuthFailed"]').contains("You must be signed in!");
    cy.get('[data-testid="Nav-Login-Btn"]').contains("Get Started Now");
  });
});
