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
  Airing: boolean;
  AiringDate: string;
  Status: AnimeStatusType;
  type: AnimeType;
  ReleaseDate: string;
  Synopsis: string;
  malId: number;
  nbEp: number;
  MalPage: string;
  duration: string;
  broadcast: string;
  NineAnimeUrl?: string;
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
            NineAnimeUrl: "/watch/sasaki-and-miyano.prrw6",
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
            NineAnimeUrl: "/watch/black-clover.v2k6",
          },
        },
        {
          input: "26243", // Owari no Seraph
          excepted: {
            title: "Owari no Seraph",
            AgeRating: "R - 17+ (violence & profanity)",
            Airing: false,
            AiringDate: "4/4/2015",
            Status: "Finished Airing",
            type: "TV",
            ReleaseDate: "spring 2015",
            Synopsis:
              "With the appearance of a mysterious virus that kills everyone above the age of 13, mankind becomes enslaved by previously hidden, power-hungry vampires who emerge in order to subjugate society with the promise of protecting the survivors, in exchange for donations of their blood. Among these survivors are Yuuichirou and Mikaela Hyakuya, two young boys who are taken captive from an orphanage, along with other children whom they consider family. Discontent with being treated like livestock under the vampires' cruel reign, Mikaela hatches a rebellious escape plan that is ultimately doomed to fail. The only survivor to come out on the other side is Yuuichirou, who is found by the Moon Demon Company, a military unit dedicated to exterminating the vampires in Japan. Many years later, now a member of the Japanese Imperial Demon Army, Yuuichirou is determined to take revenge on the creatures that slaughtered his family, but at what cost? Owari no Seraph is a post-apocalyptic supernatural shounen anime that follows a young man's search for retribution, all the while battling for friendship and loyalty against seemingly impossible odds. [Written by MAL Rewrite]",
            malId: 26243,
            nbEp: 12,
            MalPage: "https://myanimelist.net/anime/26243/Owari_no_Seraph",
            duration: "23 min per ep",
            broadcast: "Saturdays at 22:00 (JST)",
            NineAnimeUrl: "/watch/seraph-of-the-end-vampire-reign.g98",
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
          expect(AnimeData[exceptedKey]).toBe(excepted[exceptedKey]);
        }

        await (() => new Promise((res) => setTimeout(res, 2000)))();
      }
    },
    60_000 // 1min timeout
  );
});
