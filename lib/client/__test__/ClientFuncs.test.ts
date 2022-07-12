import { expect, test, describe } from "vitest";
import { DateOfWeek } from "../../utils/types/types";
import {
  FormatDate,
  removeParamsFromPhotoUrl,
  WhitchDate,
  WhitchDay,
  ConvertBroadcastTimeZone,
} from "../ClientFuncs";

interface TestCase<I, E> {
  input: I;
  excepted: E;
}

describe.concurrent("Testing ClientFuncs", () => {
  test("removeParamsFromPhotoUrl", () => {
    const UrlTest: TestCase<string, string>[] = [
      {
        input: "https://exemple.com/image.jpg?s=sd45qsd945qs9",
        excepted: "https://exemple.com/image.jpg",
      },
      {
        input: `ima.png?s=s*d4é-è5qsdH"GD"Q945q*$^$ù$q^s9ge`,
        excepted: "ima.png",
      },
    ];

    for (const { input, excepted } of UrlTest) {
      expect(removeParamsFromPhotoUrl(input)).toBe(excepted);
    }
  });

  test("FormatDate", () => {
    expect(
      FormatDate(
        "Tue Jul 12 2022 23:10:19 GMT+0200 (Central European Summer Time)"
      )
    ).toBe("7/12/2022");
  });

  test("WhitchDate/Day", () => {
    for (let i = 0; i <= 6; i++) {
      const Day = WhitchDay(i as DateOfWeek);
      const TodayDay = WhitchDay(new Date().getDay() as DateOfWeek);
      const DateNum = WhitchDate(Day);

      const expectDay =
        new Date()
          .toLocaleDateString("en-US", {
            weekday: "long",
          })
          .toLowerCase() + "s";

      expect(TodayDay).toBe(expectDay);
      expect(DateNum).toBe(i);
    }
  });

  test("ConvertBroadcastTimeZone", () => {
    const BroadcastTests: TestCase<string, number | string>[] = [
      {
        input: "Mondays at 00:30 (JST)",
        excepted: "sundays 2:30 PM",
      },
      {
        input: "Wednesdays at 08:56 (JST)",
        excepted: "tuesdays 10:56 PM",
      },
      {
        input: "Sundays at 00:30 (JST)",
        excepted: "saturdays 2:30 PM",
      },
      {
        input: "Saturdays at 01:55 (JST)",
        excepted: "fridays 3:55 PM",
      },
      {
        input: "Tuesdays at 22:00 (JST)",
        excepted: "tuesdays 12:00 PM",
      },
    ];

    for (const { input, excepted } of BroadcastTests) {
      expect(ConvertBroadcastTimeZone(input, "BroadcastFormated")).toBe(
        excepted
      );
    }
  });
});
