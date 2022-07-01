import {
  AnimeWatchType,
  LoginWithCypress,
  VisitWithLoginCheck,
} from "../support/e2e";

describe("Animes Interaction", () => {
  it("Should Login", LoginWithCypress);

  const FiveAnimesToAdd = ["Sasaki to Miyano", "Owari no Seraph"];

  it("Should add 5 animes", () => {
    VisitWithLoginCheck("/");
    cy.get('[data-testid="HomeAnimesList"]').should("not.exist");

    for (const animeTitle of FiveAnimesToAdd) {
      cy.visit("/anime");
      cy.get('[data-testid="SearchAnimeInput"]')
        .type(`{selectAll}{backspace}${animeTitle}`)
        .should("have.value", animeTitle);

      cy.wait(605); // Debounce Time
      cy.get('[data-testid="ResultFoundTitle"]').contains(
        `"${animeTitle.trim().toLowerCase()}"`
      );

      cy.get('[data-testid="SearchAnimesFoundList"]')
        .children()
        .should("have.length.at.least", 1);
      cy.get(
        '[data-testid="SearchAnimesFoundList"] :first-child > a > h1'
      ).then((el) => {
        expect(el.text()).to.include(animeTitle.toLowerCase());
      });
      cy.get('[data-testid="SearchAnimesFoundList"] :first-child > a').then(
        (el) => {
          cy.visit(el.attr("href"));
        }
      );

      cy.url().should("include", "/anime/");
      cy.get("nav").should("not.have.text", "Connecting to your account");

      cy.get('[data-testid="MyAnimesSelectType"]').select(
        AnimeWatchType.WATCHING
      );
      cy.wait(2000);
    }

    cy.visit("/");

    cy.get('[data-testid="HomeAnimesListContainer"]')
      .should("not.have.text", "You have 0 animes")
      .should("not.have.text", "No animes");
    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length", 2);
    for (const animeTitle of FiveAnimesToAdd) {
      cy.get('[data-testid="HomeAnimesList"]').contains(animeTitle);
    }
  });
  it("Should remove 2 animes", () => {
    // Unwatched
    // Won't watch
  });

  it("Should change anime status", () => {
    // ["watched", "watching", "want_to_watch", "dropped"]
    // + verif in "/"
  });

  it("Should create a collection", () => {});
  it("Should add one anime to a collection", () => {});

  it("Should delete one anime from a collection", () => {});
  it("Should delete a collection", () => {});
});
