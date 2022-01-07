import React, { FC, useEffect, useRef, useState } from "react";
// DB
import { auth, db } from "../../lib/firebase";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
// Types
import { AnimeWatchType } from "../../lib/types/enums";

/* INTERFACES */
interface MyAnimeProps {
  AnimeType: null | AnimeWatchType;
  malId: number;
  classNameProps?: string;
}

const AnimesWatchType: FC<MyAnimeProps> = ({
  AnimeType,
  malId,
  classNameProps,
}) => {
  const { WATCHING, WATCHED, UNWATCHED, WANT_TO_WATCH, WONT_WATCH, DROPPED } =
    AnimeWatchType;
  const [SelectValue, setSelectValue] = useState(AnimeType);
  const FirstEffectSkipped = useRef(false);

  useEffect(() => {
    if (!FirstEffectSkipped.current) {
      FirstEffectSkipped.current = true;
      return;
    }

    SelectValue !== AnimeType && ChangeUserAnimeWatchType(SelectValue, malId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SelectValue]);

  useEffect(() => {
    setSelectValue(AnimeType);
  }, [AnimeType]);

  const ChangeUserAnimeWatchType = async (
    newType: AnimeWatchType,
    malId: number
  ) => {
    const UserAnimeRef = doc(
      doc(db, "users", auth.currentUser.uid),
      "animes",
      malId.toString()
    );

    if (newType === AnimeWatchType.UNWATCHED)
      return await deleteDoc(UserAnimeRef);

    await setDoc(UserAnimeRef, {
      AnimeId: malId,
      WatchType: newType,
      Fav: false,
    });
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex justify-center">
      <select
        value={SelectValue}
        onChange={(e) => setSelectValue(e.target.value as AnimeWatchType)}
        className={`w-full bg-bgi-black text-headline text-center text-2xl outline-none focus:ring-2 focus:ring-primary-main
             rounded-lg px-1 transition${
               classNameProps && ` ${classNameProps}`
             }`}
      >
        <option value={UNWATCHED}>❌ Unwatched</option>
        <option value={WATCHING}>👀 Whatching</option>
        <option value={WATCHED}>✅ Watched</option>
        <option value={WANT_TO_WATCH}>⌚ Want to Watch</option>
        <option value={DROPPED}>🚮 Dropped</option>
        <option value={WONT_WATCH}>⛔ Won&apos;t Watch</option>
      </select>
    </form>
  );
};

export default AnimesWatchType;
