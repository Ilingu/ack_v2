import React, { FC, useEffect } from "react";
// DB
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
// UI
import { AiOutlineCheckSquare, AiOutlineCloseSquare } from "react-icons/ai";
import toast from "react-hot-toast";
import { AnimeWatchType } from "../../lib/types/enums";

/* INERFACES */
interface MovieFocusMode {
  title: string;
  duration: string;
  AnimeId: string;
  CancelModeFocus: () => void;
}

const MovieFocusMode: FC<MovieFocusMode> = ({
  duration,
  title,
  AnimeId,
  CancelModeFocus,
}) => {
  useEffect(() => {
    scrollTo(0, 0);
    document.body.style.overflow = "hidden";

    // UnMounted
    return () => {
      document.body.style.overflow = null;
    };
  }, []);

  const MarkMovieAsWatched = async () => {
    try {
      const AnimeRef = () =>
        doc(
          doc(db, "users", auth.currentUser.uid),
          "animes",
          AnimeId.toString()
        );

      await updateDoc(AnimeRef(), {
        WatchType: AnimeWatchType.WATCHED,
      });

      CancelModeFocus();
      toast.success(`Marked as watched !`);
    } catch (err) {
      toast.error("Error, cannot execute this action.");
    }
  };

  /* JSX */
  return (
    <div className="absolute top-0 left-0 h-screen w-screen z-20 bg-bgi-darker bg-opacity-60 flex flex-col justify-center items-center">
      <h1
        className="relative font-bold text-2xl sm:w-72 sm:min-w-max w-10/12 p-4 bg-bgi-black bg-opacity-80 hover:bg-opacity-90 transition-all rounded-lg
       text-headline mb-5 scale-110 text-center"
      >
        <span>{title}</span>
        <br />
        <span className="text-xl font-semibold underline decoration-primary-whiter">
          {duration}
        </span>
      </h1>
      <div className="flex gap-3">
        <button
          onClick={CancelModeFocus}
          className="text-headline text-5xl p-4 rounded-full bg-bgi-black hover:text-red-400 hover:ring-2 
        hover:ring-red-500 transition-all"
        >
          <AiOutlineCloseSquare />
        </button>
        <button
          onClick={MarkMovieAsWatched}
          className="text-headline text-5xl p-4 rounded-full bg-bgi-black hover:text-green-400 hover:ring-2 
        hover:ring-green-500 transition-all"
        >
          <AiOutlineCheckSquare />
        </button>
      </div>
    </div>
  );
};

export default MovieFocusMode;
