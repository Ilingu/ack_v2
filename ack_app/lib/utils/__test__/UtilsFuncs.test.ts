import { expect, test, describe } from "vitest";
import type { UserAnimeShape } from "../types/interface";
import { AnimeWatchType } from "../types/enums";
import {
  isValidUrl,
  filterUserAnime,
  removeDuplicates,
  SpotDifferenciesBetweenArrays,
  IsEmptyString,
  shuffleArray,
  ParseCookies,
} from "../UtilsFuncs";

interface TestCase<I, E> {
  input: I;
  excepted: E;
}

describe.concurrent("Testing UtilFuncs", () => {
  test.concurrent("isValidUrl", () => {
    const Urls: TestCase<string, boolean>[] = [
      { input: "http://localhost:3000/", excepted: true },
      { input: "A54sqd  SUJi ", excepted: false },
      { input: "https://ack.vercel.app", excepted: true },
      {
        input:
          "https://www.education.gouv.fr/reussir-au-lycee/baccalaureat-comment-se-passe-le-grand-oral-100028",
        excepted: true,
      },
      { input: "www.exemple.com", excepted: false },
    ];

    for (const { input, excepted } of Urls) {
      expect(isValidUrl(input)).toBe(excepted);
    }
  });

  test.concurrent("filterUserAnime", () => {
    const UserAnimesTest: TestCase<UserAnimeShape[], UserAnimeShape[]> = {
      input: [
        { AnimeId: 1, Fav: false, WatchType: AnimeWatchType.WATCHING },
        { AnimeId: 2, Fav: false, WatchType: AnimeWatchType.WATCHED },
        { AnimeId: 3, Fav: true, WatchType: AnimeWatchType.WANT_TO_WATCH },
        { AnimeId: 4, Fav: false, WatchType: AnimeWatchType.DROPPED },
        { AnimeId: 5, Fav: true, WatchType: AnimeWatchType.WONT_WATCH },
        { AnimeId: 6, Fav: false, WatchType: AnimeWatchType.UNWATCHED },
      ],
      excepted: [
        { AnimeId: 1, Fav: false, WatchType: AnimeWatchType.WATCHING },
        { AnimeId: 2, Fav: false, WatchType: AnimeWatchType.WATCHED },
        { AnimeId: 3, Fav: true, WatchType: AnimeWatchType.WANT_TO_WATCH },
        { AnimeId: 4, Fav: false, WatchType: AnimeWatchType.DROPPED },
      ],
    };

    const TestRes = filterUserAnime(UserAnimesTest.input);
    expect(TestRes.length).toBe(4);

    for (const [i, res] of TestRes.entries()) {
      expect(res.WatchType).not.toBe(AnimeWatchType.UNWATCHED);
      expect(res.WatchType).not.toBe(AnimeWatchType.WONT_WATCH);
      expect(UserAnimesTest.input[i]).toEqual(res);
    }
  });

  test.concurrent("removeDuplicates", () => {
    let SameMemoryRef = [2, 5, 8, "2"];
    const DuplicatesTest: TestCase<any[], any[]>[] = [
      {
        input: [1, 2, 5, 3, 2, 4, 1001, 8, 5, 3, 1001],
        excepted: [1, 2, 5, 3, 4, 1001, 8],
      },
      {
        input: [
          "abc",
          5,
          "d",
          "http://localhost:3000",
          "abc",
          1,
          "d",
          1,
          "http://localhost:3000",
          5,
        ],
        excepted: ["abc", 5, "d", "http://localhost:3000", 1],
      },
      {
        input: [SameMemoryRef, SameMemoryRef, 28],
        excepted: [SameMemoryRef, 28],
      },
    ];

    for (const test of DuplicatesTest) {
      expect(removeDuplicates(test.input)).toEqual(test.excepted);
    }
  });

  test.concurrent("SpotDifferenciesBetweenArrays", () => {
    type CompareArray = {
      base: any[];
      compare: any[];
      BaseKey: string;
      CompareKey: string;
    };
    const ArraysTest: TestCase<CompareArray, any[]>[] = [
      {
        input: {
          base: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
          compare: [{ ID: 1 }, { ID: 3 }],
          BaseKey: "id",
          CompareKey: "ID",
        },
        excepted: [2, 4, 5],
      },
      {
        input: {
          base: [
            { num: "26", ihatetesting: { jest: true, vitest: false } },
            { num: "853", ihatetesting: { jest: true, vitest: false } },
            { num: "1038", ihatetesting: { jest: true, vitest: false } },
            { num: "500598", ihatetesting: { jest: true, vitest: false } },
            { num: "742", ihatetesting: { jest: true, vitest: false } },
          ],
          compare: [
            { number: "26", lol: true },
            { number: "500598", lol: true },
          ],
          BaseKey: "num",
          CompareKey: "number",
        },
        excepted: ["853", "1038", "742"],
      },
    ];

    for (const {
      input: { base, compare, BaseKey, CompareKey },
      excepted,
    } of ArraysTest) {
      expect(
        SpotDifferenciesBetweenArrays<any>(base, compare, BaseKey, CompareKey)
      ).toEqual(excepted);
    }
  });

  test.concurrent("shuffleArray", () => {
    const abc = "abcdefghijklmnopqrstuvwxyz";
    const ArraysTest: TestCase<any[], any[]>[] = [
      {
        input: Array(1000)
          .fill(0)
          .map((_, i) => i),
        excepted: [],
      },
      {
        input: Array(1000)
          .fill(0)
          .map(
            (_, i) => `${i}${abc[Math.round(Math.random() * (abc.length - 1))]}`
          ),
        excepted: [],
      },
      {
        input: Array.from({ length: 10_000 }, () =>
          Math.round(Math.random() * 100)
        ),
        excepted: [],
      },
    ];

    for (const { input } of ArraysTest) {
      const SuffledArr = shuffleArray([...input]);
      expect(SuffledArr).not.toEqual(input);
    }
  });

  test.concurrent("IsEmptyString", () => {
    const StringTests: TestCase<any, boolean>[] = [
      { input: "", excepted: true },
      { input: null, excepted: true },
      { input: undefined, excepted: true },
      { input: { string: "string" }, excepted: true },
      { input: " ", excepted: true },
      { input: "     ", excepted: true },
      { input: "  s  ", excepted: false },
      { input: "YoTo4²é$", excepted: false },
      { input: "Ilingu", excepted: false },
    ];

    for (const { input, excepted } of StringTests) {
      expect(IsEmptyString(input)).toBe(excepted);
    }
  });

  test.concurrent("ParseCookies", () => {
    const CookiesSample: TestCase<string, any> = {
      input:
        "CONSENT=PENDING+272; SID=LwhOjtQeQ0d80MJiLT3yi1EUM1vSgQXpOvSgweJdx3o6uzJhA5wjfqStIhx42bRdtLcFng.; APISID=PRcCOHx5w9WEHp6M/AL6C9SzppvD1qqpoo; SAPISID=eJMb864uxLOWA60f/ADf4N8kJzSJYV13EO; __Secure-1PAPISID=eJMb864uxLOWA60f/ADf4N8kJzSJYV13EO; __Secure-3PAPISID=eJMb864uxLOWA60f/ADf4N8kJzSJYV13EO; PREF=tz=Europe.Paris&f6=40000000&f5=30000; SIDCC=AJi4QfG36Tv4_0z3BgPmWhz2qBpL3IZCKxnvlr9EbrY8AoxftNbPisv-b-LYcir1bvh5QsNrU3o",
      excepted: {
        CONSENT: "PENDING+272",
        SID: "LwhOjtQeQ0d80MJiLT3yi1EUM1vSgQXpOvSgweJdx3o6uzJhA5wjfqStIhx42bRdtLcFng.",
        APISID: "PRcCOHx5w9WEHp6M/AL6C9SzppvD1qqpoo",
        SAPISID: "eJMb864uxLOWA60f/ADf4N8kJzSJYV13EO",
        "__Secure-1PAPISID": "eJMb864uxLOWA60f/ADf4N8kJzSJYV13EO",
        "__Secure-3PAPISID": "eJMb864uxLOWA60f/ADf4N8kJzSJYV13EO",
        PREF: "tz",
        SIDCC:
          "AJi4QfG36Tv4_0z3BgPmWhz2qBpL3IZCKxnvlr9EbrY8AoxftNbPisv-b-LYcir1bvh5QsNrU3o",
      },
    };

    const anwser = ParseCookies(CookiesSample.input);

    expect(anwser.success).toBe(true);
    expect(anwser.data).toEqual(CookiesSample.excepted);
  });
});
