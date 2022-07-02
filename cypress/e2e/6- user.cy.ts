import { LoginWithCypress, VisitWithLoginCheck } from "../support/e2e";

describe("User Interaction", () => {
  const RenameUsername = (NewUsername: string) => {
    VisitWithLoginCheck("/settings");
    cy.get('[data-testid="RenameUsernameInput"]')
      .type(`{selectAll}{backspace}${NewUsername}`)
      .should("have.value", NewUsername);

    cy.get('[data-testid="RenameUsernameBtnSubmition"]').click();
    cy.get('[data-testid="UserUsername"]').contains(NewUsername);
  };

  it("Should Login", LoginWithCypress);

  it("Rename Username", () => {
    RenameUsername("testaccount"); // Change 1
    RenameUsername("ilingutest"); // Change 2
  });

  it("Delete User", () => {
    VisitWithLoginCheck("/settings");
    cy.get('[data-testid="DeleteUserBtn"]').dblclick();
    cy.wait(11000);

    cy.visit("/");
    cy.get('[data-testid="AuthFailed"]').contains("You must be signed in!");
    cy.get('[data-testid="Nav-Login-Btn"]').contains("Get Started Now");
  });
});
