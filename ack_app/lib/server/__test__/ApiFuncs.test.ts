import { expect, test, describe } from "vitest";
import { fetch } from "cross-fetch";

import type { AnimeStatusType, AnimeType } from "../../utils/types/types";
import { IsBlacklistedHost, GetAnimeData } from "../ApiFunc";

interface TestCase<I, E> {
  input: I;
  excepted: E;
}

interface LittleAnimeShape {
  title: string;
  AgeRating: string;
  Airing?: boolean;
  AiringDate: string;
  Status?: AnimeStatusType;
  type: AnimeType;
  ReleaseDate: string;
  Synopsis: string;
  malId: number;
  nbEp: number;
  MalPage: string;
  duration: string;
  broadcast: string;
  ProvidersLink?: string[];
}

global.fetch = fetch;

describe.concurrent("Testing ApiFuncs", () => {
  test.concurrent("IsBlacklistedHost", () => {
    const BlacklistTest: TestCase<any, boolean>[] = [
      { input: "ack.vercel.app", excepted: false },
      { input: "localhost:3000", excepted: false },
      { input: "ilovetest.com", excepted: true },
      { input: "https://google.com", excepted: true },
      { input: 5, excepted: true },
    ];
    for (const { input, excepted } of BlacklistTest) {
      expect(IsBlacklistedHost(input)).toBe(excepted);
    }
  });

  test.concurrent(
    "GetAnimeData",
    async () => {
      const FetchTests: TestCase<string, LittleAnimeShape>[] = [
        {
          input: "44055", // Sasaki to Miyano
          excepted: {
            title: "Sasaki to Miyano",
            AgeRating: "PG-13 - Teens 13 or older",
            Airing: false,
            AiringDate: "1/10/2022",
            Status: "Finished Airing",
            type: "TV",
            ReleaseDate: "winter 2022",
            Synopsis: `Yoshikazu Miyano's troubles first start one hot summer day when Shuumei Sasaki steps into his life. Sasaki saves Miyano's classmate from a group of bullies, and after that, Miyano cannot seem to shake off his eccentric upperclassman. His silent admiration for Sasaki gradually sours into annoyance each time the so-called delinquent refuses to leave him alone. Constantly being called by cute nicknames and having his boundaries ignored, Miyano wonders why Sasaki wants to get close to him. The shy and easily flustered Miyano harbors an embarrassing secret—he is a "fudanshi," a boy who likes boys' love (BL) manga. The last thing he wants is for other students to find out, but through a slip of the tongue, he reveals the truth to Sasaki. Intrigued, the clueless Sasaki asks to borrow a book to read, which he is given very reluctantly. To Miyano's surprise, Sasaki enjoys the BL that he receives and asks for more, marking a shift in their strange dynamic. Although Sasaki appears to possess some personal agenda, his feelings for Miyano become complicated the more time they spend together. As they now share a common interest, their relationship is poised to change and further develop. [Written by MAL Rewrite]`,
            malId: 44055,
            nbEp: 12,
            MalPage: "https://myanimelist.net/anime/44055/Sasaki_to_Miyano",
            duration: "23 min per ep",
            broadcast: "Mondays at 00:30 (JST)",
            ProvidersLink: [
              "https://animixplay.to/v1/sasaki-to-miyano",
              "https://gogoanime.ee/category/sasaki-to-miyano",
              "https://lite.animevibe.se/anime/sasaki-to-miyano",
            ],
          },
        },
        {
          input: "34572", // Black Clover
          excepted: {
            title: "Black Clover",
            AgeRating: "PG-13 - Teens 13 or older",
            Airing: false,
            AiringDate: "10/3/2017",
            Status: "Finished Airing",
            type: "TV",
            ReleaseDate: "fall 2017",
            Synopsis: `Asta and Yuno were abandoned at the same church on the same day. Raised together as children, they came to know of the "Wizard King"—a title given to the strongest mage in the kingdom—and promised that they would compete against each other for the position of the next Wizard King. However, as they grew up, the stark difference between them became evident. While Yuno is able to wield magic with amazing power and control, Asta cannot use magic at all and desperately tries to awaken his powers by training physically. When they reach the age of 15, Yuno is bestowed a spectacular Grimoire with a four-leaf clover, while Asta receives nothing. However, soon after, Yuno is attacked by a person named Lebuty, whose main purpose is to obtain Yuno's Grimoire. Asta tries to fight Lebuty, but he is outmatched. Though without hope and on the brink of defeat, he finds the strength to continue when he hears Yuno's voice. Unleashing his inner emotions in a rage, Asta receives a five-leaf clover Grimoire, a "Black Clover" giving him enough power to defeat Lebuty. A few days later, the two friends head out into the world, both seeking the same goal—to become the Wizard King! [Written by MAL Rewrite]`,
            malId: 34572,
            nbEp: 170,
            MalPage: "https://myanimelist.net/anime/34572/Black_Clover",
            duration: "23 min per ep",
            broadcast: "Tuesdays at 18:25 (JST)",
            ProvidersLink: [
              "https://animixplay.to/v1/black-clover",
              "https://gogoanime.ee/category/black-clover",
              "https://lite.animevibe.se/anime/black-clover",
            ],
          },
        },
        {
          input: "47164", // Danmachi IV
          excepted: {
            title:
              "Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka IV: Shin Shou - Meikyuu-hen",
            AgeRating: "PG-13 - Teens 13 or older",
            AiringDate: "7/21/2022",
            type: "TV",
            ReleaseDate: "summer 2022",
            Synopsis:
              "Intrepid adventurer Bell Cranel has leveled up, but he can’t rest on his dungeoneering laurels just yet. The Hestia Familia still has a long way to go before it can stand toe-to-toe with the other Familias of Orario — but before Bell can set out on his next mission, reports of a brutal murder rock the adventuring community! One of Bell’s trusted allies stands accused of the horrible crime, and it’s up to Bell and his friends to clear their name and uncover a nefarious plot brewing in the dungeon’s dark depths. (Source: Sentai Filmworks)",
            malId: 47164,
            nbEp: 12,
            MalPage:
              "https://myanimelist.net/anime/47164/Dungeon_ni_Deai_wo_Motomeru_no_wa_Machigatteiru_Darou_ka_IV__Shin_Shou_-_Meikyuu-hen",
            duration: "23 min",
            broadcast: "Saturdays at 01:05 (JST)",
            ProvidersLink: [
              "https://animixplay.to/v1/dungeon-ni-deai-wo-motomeru-no-wa-machigatteiru-darou-ka-iv",
              "https://gogoanime.ee/category/dungeon-ni-deai-wo-motomeru-no-wa-machigatteiru-darou-ka-iv",
              "https://lite.animevibe.se/anime/dungeon-ni-deai-wo-motomeru-no-wa-machigatteiru-darou-ka-iv",
            ],
          },
        },
      ];

      for (const { input, excepted } of FetchTests) {
        const {
          success,
          data: { AnimeData },
        } = await GetAnimeData(input);

        expect(success).toBe(true);
        for (const exceptedKey of Object.keys(excepted)) {
          if (exceptedKey === "ProvidersLink") {
            expect(AnimeData?.ProvidersLink).toEqual(excepted.ProvidersLink);
            continue;
          }
          expect(AnimeData[exceptedKey]).toBe(excepted[exceptedKey]);
        }

        await (() => new Promise((res) => setTimeout(res, 2000)))();
      }
    },
    60_000 * 3 // 3min timeout
  );
});
