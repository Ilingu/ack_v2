import { FC, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
// DB
import { auth, db } from "../../lib/firebase/firebase";
import { deleteDoc, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { DeleteAnimeIDB } from "../../lib/utils/IDB";
// Types
import { AnimeWatchType } from "../../lib/utils/types/enums";

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
  const { push } = useRouter();
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

    if (newType === AnimeWatchType.UNWATCHED) {
      push(`/anime/${malId}`);
      await DeleteAnimeIDB(malId);
      return await deleteDoc(UserAnimeRef);
    }
    if (newType === AnimeWatchType.WONT_WATCH) await DeleteAnimeIDB(malId);

    const IsExist = (await getDoc(UserAnimeRef)).exists();
    const UserAnimeMetaData = { AnimeId: malId, WatchType: newType };

    if (IsExist) return await updateDoc(UserAnimeRef, UserAnimeMetaData);
    await setDoc(UserAnimeRef, {
      ...UserAnimeMetaData,
      Fav: false,
    });
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex justify-center">
      <select
        data-testid="MyAnimesSelectType"
        value={SelectValue || UNWATCHED}
        onChange={(e) => setSelectValue(e.target.value as AnimeWatchType)}
        className={`w-full rounded-lg bg-bgi-black px-1 text-center text-2xl text-headline outline-none
             focus:ring-2 focus:ring-primary-main transition${
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
