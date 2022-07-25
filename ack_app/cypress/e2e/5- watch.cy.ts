import {
  AnimeWatchType,
  LoginWithCypress,
  VisitWithLoginCheck,
} from "../support/e2e";

describe("Watch Animes Interaction", () => {
  const GoToWatchPage = () => {
    VisitWithLoginCheck("/");

    cy.get('[data-testid="HomeAnimesList"]')
      .children()
      .should("have.length.at.least", 1);

    cy.get('[data-testid="HomeAnimesList"] :first-child > a').then(($a) => {
      const hrefAttr = $a.attr("href");
      cy.wrap(hrefAttr).as("hrefPath"); // Get and set to @hrefPath the watch path of the 1st anime

      const hrefToArr = hrefAttr.split("/");
      cy.wrap(hrefToArr[hrefToArr.length - 1]).as("animeId"); // Get and set to @hrefPath the watch path of the 1st anime
    });

    cy.get("@hrefPath").then((hrefPath) => {
      VisitWithLoginCheck(hrefPath as unknown as string);
      cy.url().should("include", hrefPath); // Check that we are on the correct page
    });

    cy.get("@animeId").then((animeId) => {
      expect(isNaN(parseInt(animeId as unknown as string))).to.equal(false);
    });

    // Get the anime EpisodesLength
    cy.get('[data-testid="EpisodesLength"]').then(($span) => {
      const EpisodesLength = parseInt($span.text());
      expect(isNaN(EpisodesLength)).to.equal(false);
      expect(EpisodesLength).to.be.greaterThan(0);
      cy.wrap(EpisodesLength).as("EpisodesLength");
    });

    // Get the anime EpisodesDuration
    cy.get('[data-testid="EpisodesDuration"]').then(($span) => {
      const EpisodesDuration = parseInt($span.text());
      expect(isNaN(EpisodesDuration)).to.equal(false);
      expect(EpisodesDuration).to.be.greaterThan(0);
      cy.wrap(EpisodesDuration).as("EpisodesDuration");
    });

    // Get the anime EpisodesRemaining
    cy.get('[data-testid="EpisodesRemaining"]').then(($span) => {
      const EpisodesRemaining = parseInt($span.text());
      expect(isNaN(EpisodesRemaining)).to.equal(false);
      expect(EpisodesRemaining).to.be.greaterThan(0);
      cy.wrap(EpisodesRemaining).as("EpisodesRemaining");
    });
  };

  beforeEach(() => {
    if (Cypress.currentTest.title === "Should Login") return;
    GoToWatchPage();
  });

  it("Should Login", LoginWithCypress);

  it("Should have the banner", () => {
    cy.get('[data-testid="WatchBanner"]')
      .should("exist")
      .then(($div) => {
        const bgImage = $div.css("background-image");
        expect(bgImage).to.include("url");
        expect(bgImage).to.include("https://cdn.myanimelist.net/images/anime/");
      });
  });
  it("Should have the anime cover", () => {
    cy.get('[data-testid="WatchImgPoster"]')
      .should("exist")
      .then(($img) => {
        const width = $img.css("width"),
          height = $img.css("height");

        expect(width).to.equal("200px");
        expect(height).to.equal("283px");
      });
  });
  it("Should have the correct remaining time", () => {
    cy.get("@EpisodesDuration").then((dur) => {
      cy.get("@EpisodesRemaining").then((rem) => {
        const EpisodesDuration = dur as unknown as number,
          EpisodesRemaining = rem as unknown as number;

        // Recompute the correct time remaining
        const Hours = Math.floor((EpisodesDuration * EpisodesRemaining) / 60);
        const Minutes = (EpisodesDuration * EpisodesRemaining) % 60;

        cy.get('[data-testid="WatchTimeRemaining"]').contains(
          `${Hours} Hr ${Minutes} min`
        );
      });
    });
  });

  it("Should have correct number of episodes rendered", () => {
    cy.get("@EpisodesLength").then((len) => {
      const EpisodesLength = len as unknown as number;
      cy.get('[data-testid="WatchEpsList"]')
        .children()
        .should("have.length", EpisodesLength);
    });
  });

  it("Should Descending/Ascending", () => {
    cy.get('[data-testid="WatchEpsList"] :first-child > p').contains("Ep. 1");

    cy.get("@EpisodesLength").then((len) => {
      const EpisodesLength = len as unknown as number;

      cy.get('[data-testid="WatchFilterOrderBtn"]').click();
      cy.get('[data-testid="WatchEpsList"] :first-child > p').contains(
        `Ep. ${EpisodesLength}`
      );
    });
  });

  it("Should add 5 extra episodes", () => {
    cy.get('[data-testid="WatchAddExtraEpsInput"]')
      .type("5")
      .should("have.value", "5");
    cy.get('[data-testid="WatchAddExtraEpsBtn"]').click();
    cy.wait(1000);

    cy.get("@EpisodesLength").then((len) => {
      const EpisodesLength = len as unknown as number;

      cy.get('[data-testid="WatchEpsList"]')
        .children()
        .should("have.length", EpisodesLength + 5);
    });
  });
  it("Should delete the remaining extra ep", () => {
    cy.get('[data-testid="WatchDeleteExtraEpBtn"]').each(($el) => {
      $el.trigger("click");
    });

    cy.wait(1000); // Cypress sucks
    cy.get('[data-testid="WatchDeleteExtraEpBtn"]').should("not.exist");
  });

  it("Should toggle finish with the mark btn", () => {
    cy.get('[data-testid="WatchMarkBtn"]').contains(`Mark as "watched"`);
    cy.get('[data-testid="WatchMarkBtn"]').click();
    cy.wait(1000);

    cy.get('[data-testid="MyAnimesSelectType"]').should(
      "have.value",
      AnimeWatchType.WATCHED
    );

    cy.get('[data-testid="WatchMarkBtn"]').contains(`Mark as "Unwatched"`);
    cy.get('[data-testid="WatchMarkBtn"]').click();
    cy.wait(1000);

    cy.get('[data-testid="MyAnimesSelectType"]').should(
      "have.value",
      AnimeWatchType.WATCHING
    );
  });
  it("Should finish with the focus mode", () => {
    cy.get('[data-testid="MyAnimesSelectType"]').should(
      "have.value",
      AnimeWatchType.WATCHING
    );

    // Placing Trap + Test clicking ep --> Ep 1 and Last Ep are already finished
    cy.get('[data-testid="WatchEpisodeItem"]').first().click();
    cy.wait(1000);
    cy.get('[data-testid="WatchEpisodeItem"]').last().click();
    cy.wait(1000);
    // Focus mode
    cy.get('[data-testid="WatchActivateFocusModeBtn"]').click();

    cy.get("@EpisodesLength").then((len) => {
      const EpisodesLength = len as unknown as number;

      for (let index = 0; index < EpisodesLength - 2; index++) {
        // `- 2` --> The 2 "traps" eps already finished
        cy.get('[data-testid="FocusModeNextEpBtn"]').click();
        cy.wait(100);
      }
    });

    cy.wait(500);
    cy.get('[data-testid="MyAnimesSelectType"]').should(
      "have.value",
      AnimeWatchType.WATCHED
    );
  });
  // it("Should finish the anime by clicking ep", () => {}); --> Maybe to implement but consume too much ressources
});
