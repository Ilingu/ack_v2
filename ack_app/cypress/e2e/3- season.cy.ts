import {
  LoginWithCypress,
  TheFourSeason,
  TheFourSeasonEnum,
  VisitWithLoginCheck,
  WhitchSeason,
} from "../support/e2e";

describe("Season Interaction", () => {
  const CheckResult = () => {
    cy.get('[data-testid="SeasonAnimesFound"]')
      .children()
      .should("have.length.at.least", 5)
      .should("have.length.at.most", 50);
  };

  const RandomSeason = () => {
    const SeasonArr = Object.values(TheFourSeasonEnum);
    return SeasonArr[Math.round(Math.random() * (SeasonArr.length - 1))];
  };

  beforeEach(() => {
    if (Cypress.currentTest.title === "Should Login") return;
    VisitWithLoginCheck("/anime/season");
  });

  it("Should Login", LoginWithCypress);

  it("Should Have Upcoming and Current Animes Season", () => {
    CheckResult();

    cy.get('[data-testid="SeasonBtnSubmition"]').click();
    CheckResult();
  });

  it("Should Pick a Previous Year Season", () => {
    cy.get('[data-testid="SeasonYearInput"]')
      .type(`{selectAll}{backspace}${new Date().getFullYear() - 1}`)
      .should("have.value", `${new Date().getFullYear() - 1}`);
    cy.get('[data-testid="SeasonSeasonSelect"]').select(RandomSeason());
    cy.get('[data-testid="SeasonBtnSubmition"]').click();
    cy.wait(250);

    CheckResult();
  });

  type SeasonNum = { [season in TheFourSeason]: number };
  type NumSeason = { [num: number]: string };
  it("Should Pick Next Season", () => {
    const SeasonToNum: SeasonNum = {
      spring: 0,
      summer: 1,
      fall: 2,
      winter: 3,
    };
    const NumToSeason: NumSeason = Object.keys(SeasonToNum)
      .map((FourS, i) => ({ [i]: FourS }))
      .reduce((prev, curr) => ({ ...prev, ...curr }));

    const currentSeason = WhitchSeason();
    const NextSeason =
      NumToSeason[
        SeasonToNum[currentSeason] + 1 === 4
          ? 0
          : SeasonToNum[currentSeason] + 1
      ];

    cy.get('[data-testid="SeasonSeasonSelect"]').select(NextSeason);
    cy.get('[data-testid="SeasonBtnSubmition"]').click();
    cy.wait(250);

    CheckResult();
  });
});
