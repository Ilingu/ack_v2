// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

export const LoginWithCypress = () => {
  cy.visit("/sign-up");
  cy.contains("Sign In/Up");
  cy.get('[data-testid="LoginWithGithub"]').click();
  cy.wait(2000);
};

export const LogoutWithCypress = () => {
  cy.visit("/sign-up");
  cy.contains("Already Sign-in!");
  cy.get('[data-testid="SignOutLoginPage"]').click();
};

export const VisitWithLoginCheck = (path: string, timeout?: number) => {
  cy.visit(path);
  cy.get("nav").should("not.have.text", "Connecting to your account");
  if (timeout) cy.wait(timeout);
};

export const WhitchSeason = () => {
  const Month = new Date().getMonth() + 1;
  const Day = new Date().getDate();
  let season: TheFourSeason;
  switch (true) {
    case Month === 12 && Day >= 21:
    case Month === 1:
    case Month === 2:
    case Month === 3 && Day < 20:
      season = "winter";
      break;
    case Month === 3 && Day >= 20:
    case Month === 4:
    case Month === 5:
    case Month === 6 && Day < 20:
      season = "spring";
      break;
    case Month === 6 && Day >= 20:
    case Month === 7:
    case Month === 8:
    case Month === 9 && Day < 22:
      season = "summer";
      break;
    case Month === 9 && Day >= 22:
    case Month === 10:
    case Month === 11:
    case Month === 12 && Day < 21:
      season = "fall";
      break;
    default:
      break;
  }
  return season;
};

export const TestCorrectAnimes: TestingAnimes[] = [
  { title: "Sasaki to Miyano", found: true }, // Exact Match
  {
    title: "* Seraph Owari no *", // Inversed Match
    found: true,
  },
  {
    title: "BlAcK-ClOveR", // Case + Character sensitive
    found: true,
  },
  {
    title: "Bungou Dogs Stray", // Not full name + Inversed
    found: true,
  },
  {
    title: " Re:Zero ", // ":" + trim
    found: true,
  },
  {
    title: "Givne", // "n" and "e" swapped
    found: true,
  },
  {
    title: "SAO", // only initials
    found: true,
  },
  {
    title: "Kaguya-sama wa Kokurasetai? Tensai-tachi no Renai }Zunousen", // Long Name + paratise characters
    found: true,
  },
];
export const TestInvalidAnimes: TestingAnimes[] = [
  { title: "sdd", found: false }, // 3 letters
  { title: "sDd", found: false }, // 3 letters + case sensitive
  {
    title: "AzeRtyuii", // Random Letter
    found: false,
  },
  {
    title: "31859", // Random Number
    found: false,
  },
  {
    title: "3A1a8bc85ez7e9OP", // Random Number + Letter
    found: false,
  },
  {
    title: `¨^$*ù!:;,à@"'&é(--èè_çàà}]@/.?§^\`|[}{#~])`, // Symbol
    found: false,
  },
];

// Types
export enum TheFourSeasonEnum {
  WINTER = "winter",
  SPRING = "spring",
  SUMMER = "summer",
  FALL = "fall",
}
export enum AnimeWatchType {
  UNWATCHED = "unwatched",
  WATCHED = "watched",
  WATCHING = "watching",
  WANT_TO_WATCH = "want_to_watch",
  WONT_WATCH = "wont_watch",
  DROPPED = "dropped",
}
export enum AnimeWatchTypeDisplayable {
  WATCHED = "watched",
  WATCHING = "watching",
  WANT_TO_WATCH = "want_to_watch",
  DROPPED = "dropped",
  ALL = "all",
  FAV = "favorite",
}
type TestingAnimes = { title: string; found: boolean };
export type TheFourSeason = "winter" | "spring" | "summer" | "fall";
