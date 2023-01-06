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
  // Synopsis: string;
  malId: number;
  nbEp: number;
  MalPage: string;
  duration: string;
  broadcast: string;
  YugenId?: string;
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
            malId: 44055,
            nbEp: 12,
            MalPage: "https://myanimelist.net/anime/44055/Sasaki_to_Miyano",
            duration: "23 min per ep",
            broadcast: "Mondays at 00:30 (JST)",
            YugenId: "/11550/sasaki-to-miyano/",
          },
        },
        /*   {
          input: "34572", // Black Clover
          excepted: {
            title: "Black Clover",
            AgeRating: "PG-13 - Teens 13 or older",
            Airing: false,
            AiringDate: "10/3/2017",
            Status: "Finished Airing",
            type: "TV",
            ReleaseDate: "fall 2017",
            malId: 34572,
            nbEp: 170,
            MalPage: "https://myanimelist.net/anime/34572/Black_Clover",
            duration: "23 min per ep",
            broadcast: "Tuesdays at 18:25 (JST)",
            YugenId: "/875/black-clover/",
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
            malId: 47164,
            nbEp: 11,
            MalPage:
              "https://myanimelist.net/anime/47164/Dungeon_ni_Deai_wo_Motomeru_no_wa_Machigatteiru_Darou_ka_IV__Shin_Shou_-_Meikyuu-hen",
            duration: "23 min per ep",
            broadcast: "Saturdays at 01:05 (JST)",
            YugenId:
              "/15631/dungeon-ni-deai-wo-motomeru-no-wa-machigatteiru-darou-ka-iv-shin-shou-meikyuu-hen/",
          },
        }, */
      ];

      for (const { input, excepted } of FetchTests) {
        console.log(`Fetching ${input}...`);
        const {
          success,
          data: { AnimeData },
        } = await GetAnimeData(input);

        expect(success).toBe(true);
        for (const exceptedKey of Object.keys(excepted))
          expect(AnimeData[exceptedKey]).toBe(excepted[exceptedKey]);

        await (() => new Promise((res) => setTimeout(res, 2000)))();
      }
    },
    60_000 * 3 // 3min timeout
  );
});
