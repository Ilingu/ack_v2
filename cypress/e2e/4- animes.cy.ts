import {
  AnimeWatchType,
  LoginWithCypress,
  VisitWithLoginCheck,
} from "../support/e2e";

describe("Animes Interaction", () => {
  it("Should Login", LoginWithCypress);

  const FiveAnimesToAdd = ["Sasaki to Miyano", "Owari no Seraph"];

  beforeEach(() => {
    cy.wrap("").as("hrefPath");
  });

  it("Should add 2 animes", () => {
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
          cy.wrap(el.attr("href")).as("hrefPath");
        }
      );

      cy.get("@hrefPath").then((hrefPath) => {
        cy.visit(hrefPath as unknown as string);
      });

      cy.get("@hrefPath").then((hrefPath) => {
        cy.url().should("include", hrefPath);
      });

      cy.get("nav").should("not.have.text", "Connecting to your account");
      cy.get('[data-testid="MyAnimesSelectType"]')
        .should("have.value", AnimeWatchType.UNWATCHED)
        .select(AnimeWatchType.WATCHING);
      cy.wait(2000);
    }

    VisitWithLoginCheck("/");

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
  it("Should remove 1 anime", () => {
    VisitWithLoginCheck("/");

    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length", 2);

    cy.get('[data-testid="HomeAnimesList"] :first-child > a').then(($a) => {
      cy.wrap($a.attr("href")).as("hrefPath");
    });

    cy.get("@hrefPath").then((hrefPath) => {
      cy.visit(hrefPath as unknown as string);
    });
    cy.get("@hrefPath").then((hrefPath) => {
      cy.url().should("include", hrefPath);
      cy.get('[data-testid="MyAnimesSelectType"]')
        .should("not.have.value", AnimeWatchType.UNWATCHED)
        .select(AnimeWatchType.UNWATCHED);

      cy.url().should(
        "include",
        (hrefPath as unknown as string).replace("watch", "anime")
      );
    });

    VisitWithLoginCheck("/");

    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length", 1);
  });

  it("Should change anime status", () => {
    VisitWithLoginCheck("/");
    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length", 1);

    const { WATCHED, WATCHING, WANT_TO_WATCH, DROPPED } = AnimeWatchType;
    const TestTypeArr = [WATCHED, WATCHING, WANT_TO_WATCH, DROPPED];
    for (const TypeWatch of TestTypeArr) {
      // + verif in "/"
      VisitWithLoginCheck("/");

      cy.get('[data-testid="HomeAnimesList"] :first-child > a').then(($a) => {
        cy.wrap($a.attr("href")).as("hrefPath");
      });

      cy.get("@hrefPath").then((hrefPath) => {
        cy.visit(hrefPath as unknown as string);
      });
      cy.get("@hrefPath").then((hrefPath) => {
        cy.url().should("include", hrefPath);
        cy.get('[data-testid="MyAnimesSelectType"]')
          .should("not.have.value", TypeWatch)
          .select(TypeWatch);
        cy.wait(2000);
      });

      VisitWithLoginCheck("/");

      cy.get('[data-testid="DropdownBtn"]').click();
      cy.get('[data-testid="DropdownChildOptions"]')
        .contains(TypeWatch.split("_").join(" "))
        .click();
      cy.get('[data-testid="DropdownBtn"]').click();

      cy.get('[data-testid="HomeAnimesList"]')
        .children()
        .should("have.length", 1);
    }
  });

  it("Should create a collection", () => {});
  it("Should add one anime to a collection", () => {});

  it("Should delete one anime from a collection", () => {});
  it("Should delete a collection", () => {});
});
