import {
  AnimeWatchType,
  LoginWithCypress,
  VisitWithLoginCheck,
  AnimeWatchTypeDisplayable,
} from "../support/e2e";

describe("Animes Interaction", () => {
  const FiveAnimesToAdd = ["Sasaki to Miyano", "Owari no Seraph"];

  const ChangeSelectWatchType = (
    NewType: AnimeWatchType | AnimeWatchTypeDisplayable
  ) => {
    cy.get('[data-testid="DropdownBtn"]').click();
    cy.get('[data-testid="DropdownChildOptions"]')
      .contains(NewType.toLowerCase().split("_").join(" ").trim())
      .click();
  };

  beforeEach(() => {
    cy.wrap("").as("hrefPath");
  });

  it("Should Login", LoginWithCypress);

  it("Should add 2 animes", () => {
    VisitWithLoginCheck("/");
    cy.get('[data-testid="HomeAnimesList"]').should("not.exist"); // Check that no anime is present

    for (const animeTitle of FiveAnimesToAdd) {
      cy.visit("/anime"); // Go to search page
      cy.get('[data-testid="SearchAnimeInput"]')
        .type(`{selectAll}{backspace}${animeTitle}`)
        .should("have.value", animeTitle); // Fill search input to the requested anime

      cy.wait(605); // Debounce Time
      cy.get('[data-testid="ResultFoundTitle"]').contains(
        `"${animeTitle.trim().toLowerCase()}"`
      );

      cy.get('[data-testid="SearchAnimesFoundList"]')
        .children()
        .should("have.length.at.least", 1); // Check if the requested anime has results
      cy.get(
        '[data-testid="SearchAnimesFoundList"] :first-child > a > h1'
      ).then((el) => {
        expect(el.text()).to.include(animeTitle.toLowerCase()); // Check if the requested anime is in the 1st result
      });
      cy.get('[data-testid="SearchAnimesFoundList"] :first-child > a').then(
        (el) => {
          cy.wrap(el.attr("href")).as("hrefPath"); // Get and set to @hrefPath the url to the anime info page
        }
      );

      cy.get("@hrefPath").then((hrefPath) => {
        cy.visit(hrefPath as unknown as string); // Go to the anime info page
      });

      cy.get("@hrefPath").then((hrefPath) => {
        cy.url().should("include", hrefPath); // Check that we are in the correct page
      });

      cy.get("nav").should("not.have.text", "Connecting to your account"); // Wait that we are correctly logged in
      cy.get('[data-testid="MyAnimesSelectType"]')
        .should("have.value", AnimeWatchType.UNWATCHED)
        .select(AnimeWatchType.WATCHING); // Change the anime status to WATCHING (this will add the anime to the user list)
      cy.wait(2000); // Cypress sucks
    }

    VisitWithLoginCheck("/"); // Return to home

    cy.get('[data-testid="HomeAnimesListContainer"]')
      .should("not.have.text", "You have 0 animes")
      .should("not.have.text", "No animes"); // Check that we now have some animes
    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length", 2); // Check that we now have the 2 previously added animes
    for (const animeTitle of FiveAnimesToAdd) {
      cy.get('[data-testid="HomeAnimesList"]').contains(animeTitle); // Check that the 2 added anime are the requeted one
    }
  });

  it("Should Search an anime", () => {
    VisitWithLoginCheck("/");

    ChangeSelectWatchType(AnimeWatchTypeDisplayable.ALL); // Change filter to "all" animes

    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length.at.least", 2); // Check that we search in a list >= 2 animes

    const RandomSearch =
      FiveAnimesToAdd[Math.round(Math.random() * (FiveAnimesToAdd.length - 1))];
    cy.get('[data-testid="HomeSearchInput"]')
      .type(RandomSearch)
      .should("have.value", RandomSearch); // Fill the search input to the anime
    cy.wait(205); // debounce time

    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length.at.least", 1); // Should have a result
    cy.get('[data-testid="HomeAnimesList"]').contains(RandomSearch); // Check if the results includes the anime
  });

  it("Should remove 1 anime", () => {
    VisitWithLoginCheck("/");

    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length", 2); // Check that the two added animes are still here

    cy.get('[data-testid="HomeAnimesList"] :first-child > a').then(($a) => {
      cy.wrap($a.attr("href")).as("hrefPath"); // Get and set to @hrefPath the watch path of the 1st anime
    });

    cy.get("@hrefPath").then((hrefPath) => {
      cy.visit(hrefPath as unknown as string); // Visit the watch page of that anime
    });
    cy.get("@hrefPath").then((hrefPath) => {
      cy.url().should("include", hrefPath); // Check that we are on the correct page
      cy.get('[data-testid="MyAnimesSelectType"]')
        .should("not.have.value", AnimeWatchType.UNWATCHED)
        .select(AnimeWatchType.UNWATCHED); // Change the anime watch type to UNWATCHED (this'll remove it from user list)

      cy.url().should(
        "include",
        (hrefPath as unknown as string).replace("watch", "anime")
      ); // Check that we've been correctly redirect to anime info page due to the remove of this anime
    });

    VisitWithLoginCheck("/"); // Return to home

    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length", 1); // Now that we've removed 1 anime we check that our list has now 1 anime (2-1=1 😉)
  });

  it("Should change anime status", () => {
    VisitWithLoginCheck("/");
    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length", 1); // Check thta at least 1 anime is present

    const { WATCHED, WATCHING, WANT_TO_WATCH, DROPPED } = AnimeWatchType;
    const TestTypeArr = [WATCHED, WANT_TO_WATCH, DROPPED, WATCHING];
    for (const TypeWatch of TestTypeArr) {
      VisitWithLoginCheck("/");

      cy.get('[data-testid="HomeAnimesList"] :first-child > a').then(($a) => {
        cy.wrap($a.attr("href")).as("hrefPath"); // Get watch path of this anime and store it to @hrefPath
      });

      cy.get("@hrefPath").then((hrefPath) => {
        cy.visit(hrefPath as unknown as string); // Test @hrefPath exist + Visit the anime WatchPage
      });
      cy.get("@hrefPath").then((hrefPath) => {
        cy.url().should("include", hrefPath);
        cy.get('[data-testid="MyAnimesSelectType"]')
          .should("not.have.value", TypeWatch)
          .select(TypeWatch); // Change status type to the testing one
        cy.wait(2000); // Cypress sucks
      });

      VisitWithLoginCheck("/"); // Return to home

      ChangeSelectWatchType(TypeWatch); // Change filter to the testing status type
      cy.get('[data-testid="HomeAnimesList"]')
        .children()
        .should("have.length", 1); // this filter should have 1 anime since we change this anime type to this status type
    }

    ChangeSelectWatchType(AnimeWatchTypeDisplayable.WATCHING); // Reset filter for others tests
  });

  const CollectionName = "ilingu";
  it("Should create a collection", () => {
    VisitWithLoginCheck("/");
    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length", 1); // Check that at least 1 anime is present

    cy.get(
      '[data-testid="HomeAnimesList"] :first-child [data-testid="HomeAddToGroup"]'
    ).click(); // Click on addgroup btn on this anime

    cy.get('[data-testid="HomeAddGroupInput"]')
      .type(CollectionName) // Check IsGroupMode=true + type collection name
      .should("have.value", CollectionName);
    cy.get('[data-testid="HomeAddGroupSubmitionBtn"]').click(); // Create collection

    cy.get('[data-testid="HomeSwitchToCollections"]').click(); // Switch to collections list

    cy.get('[data-testid="HomeGroupsList"]')
      .children()
      .should("have.length", 1); // Check collections list has 1 collection

    cy.wait(1000);
    cy.get('[data-testid="HomeGroupsList"] > div').click(); // Click on that collection
    cy.get('[data-testid="HomeSelectedGroupAnimesList"]')
      .children()
      .should("have.length", 1); // This collection should have 1 anime
  });

  // TODO: it("Should add one anime to a collection") --> PROBLEM: Not enough animes at this step

  it("Should delete one anime from a collection", () => {
    VisitWithLoginCheck("/");
    cy.get('[data-testid="HomeSwitchToCollections"]').click();

    cy.get('[data-testid="HomeGroupsList"] > div').click();
    cy.get('[data-testid="HomeSelectedGroupAnimesList"]').should("exist");
    cy.get('[data-testid="HomeSelectedGroupAnimesList"]')
      .children()
      .should("have.length", 1); // Check Only 1 anime in group

    cy.get(
      '[data-testid="HomeSelectedGroupAnimesList"] :first-child [data-testid="HomeRemoveFromGroup"]'
    ).click(); // Delete this anime from group

    cy.get('[data-testid="HomeSelectedGroupAnimesList"]')
      .children()
      .should("have.length", 0); // Check no anime left in this group
  });

  it("Should delete a collection", () => {
    VisitWithLoginCheck("/");
    cy.get('[data-testid="HomeSwitchToCollections"]').click();
    cy.get('[data-testid="HomeGroupsList"]')
      .children()
      .should("have.length", 1);

    cy.get('[data-testid="HomeGroupsList"] > div').click();
    cy.get('[data-testid="HomeSelectedGroupAnimesList"]').should("exist");
    cy.get('[data-testid="HomeDeleteSelectedGroup"]').click();
  });
});
