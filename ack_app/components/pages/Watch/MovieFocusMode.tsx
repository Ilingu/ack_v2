import { FC, useEffect } from "react";
import { ManageFullScreen } from "../../../lib/client/ClientFuncs";
// DB
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase/firebase";
// UI
import { AiOutlineCheckSquare, AiOutlineCloseSquare } from "react-icons/ai";
import toast from "react-hot-toast";
import { AnimeWatchType } from "../../../lib/utils/types/enums";

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
    scrollTo(0, 0); // UX
    document.body.style.overflow = "hidden";
    ManageFullScreen("activate");

    // UnMounted
    return () => {
      document.body.style.overflow = null;
      ManageFullScreen("desactivate");
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
    <div className="bg-bgi-darker absolute top-0 left-0 z-20 flex h-screen w-screen flex-col items-center justify-center bg-opacity-60">
      <h1
        className="bg-bgi-black text-headline relative mb-5 w-10/12 scale-110 rounded-lg bg-opacity-80 p-4 text-center text-2xl font-bold
       transition-all hover:bg-opacity-90 sm:w-72 sm:min-w-max"
      >
        <span>{title}</span>
        <br />
        <span className="decoration-primary-whiter text-xl font-semibold underline">
          {duration}
        </span>
      </h1>
      <div className="flex gap-3">
        <button
          onClick={CancelModeFocus}
          className="text-headline bg-bgi-black rounded-full p-4 text-5xl transition-all hover:text-red-400 
        hover:ring-2 hover:ring-red-500"
        >
          <AiOutlineCloseSquare />
        </button>
        <button
          onClick={MarkMovieAsWatched}
          className="text-headline bg-bgi-black rounded-full p-4 text-5xl transition-all hover:text-green-400 
        hover:ring-2 hover:ring-green-500"
        >
          <AiOutlineCheckSquare />
        </button>
      </div>
    </div>
  );
};

export default MovieFocusMode;
