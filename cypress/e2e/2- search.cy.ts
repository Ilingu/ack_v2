import {
  LoginWithCypress,
  TestCorrectAnimes,
  TestInvalidAnimes,
} from "../support/e2e";

describe("Search Interaction", () => {
  it("Should Login", LoginWithCypress);

  it("Should Find Animes via Algoria", () => {
    cy.visit("/anime");
    for (const { title, found } of [
      ...TestCorrectAnimes,
      ...TestInvalidAnimes,
    ]) {
      cy.get('[data-testid="SearchAnimeInput"]')
        .type(`{selectAll}{backspace}${title}`)
        .should("have.value", title);
      cy.wait(605); // Debounce Time
      cy.get('[data-testid="ResultFoundTitle"]').contains(
        `"${title.trim().toLowerCase()}"`
      );

      cy.get('[data-testid="ResultFoundNumber"]').should(
        `${found ? "not." : ""}have.text`,
        "0"
      );
    }
  });

  it("Should Find Anime Globally", () => {
    cy.visit("/anime");
    for (const { title } of TestCorrectAnimes.slice(0, 6)) {
      cy.get('[data-testid="SearchAnimeInput"]')
        .type(`{selectAll}{backspace}${title}`)
        .should("have.value", title);

      cy.wait(600); // Debounce Time
      cy.get('[data-testid="GlobalSearchBtn"]').click();
      cy.wait(500); // Cypress don't wait the render -_-

      cy.get('[data-testid="ResultFoundTitle"]').contains(
        `"${title.trim().toLowerCase()}"`
      );

      cy.get('[data-testid="ResultFoundNumber"]').should("not.have.text", "0");
    }
  });
});
