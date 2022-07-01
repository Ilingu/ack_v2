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

type TestingAnimes = { title: string; found: boolean };
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
