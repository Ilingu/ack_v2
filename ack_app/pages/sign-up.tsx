/* eslint-disable react-hooks/exhaustive-deps */
import { NextPage } from "next";
import React, {
  Fragment,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import Image from "next/image";
// Auth
import {
  GoogleAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../lib/firebase/firebase";
import { doc, getDoc, writeBatch } from "@firebase/firestore";
import debounce from "lodash.debounce";
// UI
import MetaTags from "../components/Services/Metatags";
import Divider from "../components/Design/Divider";
import { GlobalAppContext } from "../lib/context";
import toast from "react-hot-toast";
// Icon
import { FcGoogle } from "react-icons/fc";
import { FaTwitter, FaSignOutAlt } from "react-icons/fa";
import { AiFillGithub } from "react-icons/ai";
// Types
import type { ConnMethods } from "../lib/utils/types/types";

/* Var */
const GoogleProvider = new GoogleAuthProvider();
const TwitterProvider = new TwitterAuthProvider();
const GithubProvider = new GithubAuthProvider();

/* Components */
const SignUpPage: NextPage = () => {
  const { user, username } = useContext(GlobalAppContext);

  return (
    <Fragment>
      <MetaTags title="Sign up" description="Sign up Page for ACK" />
      <main className="flex h-screen flex-col items-center justify-center">
        <div
          className="flex h-[500px] w-[350px] flex-col items-center justify-center rounded-lg bg-bgi-whiter py-4 
        px-4 text-primary-main shadow-lg md:h-[600px] md:w-[500px]"
        >
          {user ? (
            !username ? (
              <UsernameForm />
            ) : (
              <SignOutButton />
            )
          ) : (
            <SignInButton />
          )}
        </div>
      </main>
    </Fragment>
  );
};

function SignOutButton() {
  return (
    <Fragment>
      <h1 className="text-3xl font-semibold tracking-wide text-headline">
        Already Sign-in!
      </h1>
      <button
        onClick={() => auth.signOut()}
        data-testid="SignOutLoginPage"
        className="slideBtnAnimation mt-4 w-1/3 rounded-md bg-red-400 py-2 px-2 text-lg font-semibold text-headline hover:shadow-red-100"
      >
        <FaSignOutAlt className="icon" />
        Sign Out
      </button>
    </Fragment>
  );
}

function SignInButton() {
  const signIn = async (method: ConnMethods) => {
    if (process.env.NODE_ENV !== "production") {
      try {
        await signInWithEmailAndPassword(
          auth,
          "ilingu-testing-account@fake-provider.com",
          process.env.NEXT_PUBLIC_DEV_ACCOUNT_PASSWORD
        ); // Try login
        return;
      } catch {}

      try {
        await createUserWithEmailAndPassword(
          auth,
          "ilingu-testing-account@fake-provider.com",
          process.env.NEXT_PUBLIC_DEV_ACCOUNT_PASSWORD
        );
        return;
      } catch (error) {} // Try Creating
      return;
    }

    try {
      await signInWithPopup(
        auth,
        method === "google"
          ? GoogleProvider
          : method === "twitter"
          ? TwitterProvider
          : GithubProvider
      );
      toast.success(
        `Welcome ${auth.currentUser.displayName}! Successfully Sign in !`
      );
    } catch (err) {
      toast.error("Error in authentification.");
      console.warn(err);
    }
  };

  return (
    <Fragment>
      <header className="mb-14 -mt-14 flex flex-col items-center">
        <Image
          src="/IconAck192.png"
          alt="Icon"
          width={48}
          height={48}
          className="rounded-full"
        />
        <h1 className="mb-6 text-center text-4xl font-bold">Sign In/Up</h1>
        <Divider />
      </header>
      <aside className="flex w-full flex-col items-center justify-evenly rounded-lg bg-bgi-main py-4 shadow-2xl md:w-3/4">
        <button
          onClick={() => signIn("google")}
          className="mb-4 w-5/6 rounded bg-headline py-2 px-2 text-xl
          font-semibold text-black outline-none transition hover:bg-description focus:ring-4 focus:ring-description"
        >
          <FcGoogle className="icon" /> Google
        </button>
        <button
          onClick={() => signIn("twitter")}
          className="mb-4 w-5/6 rounded bg-headline py-2 px-2 text-xl
          font-semibold text-black outline-none transition hover:bg-description focus:ring-4 focus:ring-description"
        >
          <FaTwitter className="icon text-blue-500" /> Twitter
        </button>
        <button
          data-testid="LoginWithGithub"
          onClick={() => signIn("github")}
          className="w-5/6 rounded bg-bgi-darker py-2 px-2 text-xl font-semibold 
          text-headline outline-none transition hover:bg-gray-600 focus:ring-4 focus:ring-headline"
        >
          <AiFillGithub className="icon" /> Github
        </button>
      </aside>
    </Fragment>
  );
}

function UsernameForm() {
  const [formValue, setFormValue] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(GlobalAppContext);

  useEffect(() => {
    checkUsername(formValue);
  }, [formValue]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    const re = /^(?=[a-zA-Z0-9._]{3,15}$)(?!.*[_.]{2})[^_.].*[^_.]$/;
    if (val.length < 3 || val.length > 15) {
      setFormValue(val);
      setLoading(false);
      setIsValid(false);
    }

    if (re.test(val)) {
      setFormValue(val);
      setLoading(true);
      setIsValid(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;

    // Ref
    const userDoc = doc(db, "users", user.uid);
    const usernameDoc = doc(db, "usernames", formValue);

    try {
      // Commit req at same time
      const batch = writeBatch(db);

      batch.set(userDoc, {
        username: formValue,
        photoURL: user.photoURL,
        displayName: user.displayName,
      });
      batch.set(usernameDoc, {
        uid: user.uid,
      });

      await batch.commit();
    } catch (err) {}
  };

  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (username.length >= 3 && username.length <= 15) {
        const UsernamesRef = doc(db, "usernames", username);
        const docSnap = await getDoc(UsernamesRef);
        setIsValid(!docSnap.exists());
        setLoading(false);
      }
    }, 500),
    []
  );

  return (
    <div>
      <header className="mb-8 -mt-16">
        <h1 className="mb-6 text-center text-4xl font-bold">Choose Username</h1>
        <hr />
      </header>
      <form onSubmit={onSubmit} className="flex flex-col items-center">
        <input
          type="text"
          data-testid="CreateNewUsernameInput"
          name="username"
          placeholder="username"
          value={formValue}
          onChange={onChange}
          className="w-full rounded-lg py-2 pl-2 text-xl text-black outline-none transition focus:ring-4 focus:ring-primary-main focus:ring-offset-2"
        />

        <UsernameMessage
          isValid={isValid}
          username={formValue}
          loading={loading}
        />

        <div className="w-full">
          <button
            type="submit"
            data-testid="CreateNewUsernameBtnSubmition"
            className="mt-2 w-4/6 rounded bg-green-300 py-2 px-2 text-xl font-semibold text-gray-800 outline-none  
          transition hover:bg-green-200 focus:ring-4 focus:ring-green-200 focus:ring-offset-2"
            disabled={!isValid}
          >
            Choose
          </button>
          <button
            type="submit"
            className="mt-1 w-2/6 rounded bg-red-400 py-2 px-2 text-xl font-semibold text-gray-800 outline-none 
          transition hover:bg-red-200 focus:ring-4 focus:ring-green-200 focus:ring-offset-2"
            onClick={() => auth.signOut()}
          >
            Cancel
          </button>
        </div>

        <h3 className="mt-4 text-lg font-semibold text-headline">
          Debug State
        </h3>
        <hr className="w-1/2" />
        <div className="text-headline">
          Username:{" "}
          <span className="font-medium text-gray-300">{formValue}</span>
          <br />
          Loading:{" "}
          <span className="font-medium text-gray-300">
            {loading.toString()}
          </span>
          <br />
          Username Valid:{" "}
          {isValid ? (
            <span className="font-medium text-green-500">true</span>
          ) : (
            <span className="font-medium text-red-500">false</span>
          )}
        </div>
      </form>
    </div>
  );
}

function UsernameMessage({ username, isValid, loading }) {
  if (loading) return <p className="mt-1">Checking...</p>;
  if (isValid)
    return (
      <p
        data-testid="CreateUsernameStatusDebug"
        className="mt-1 text-green-500"
      >
        {username} is available!
      </p>
    );
  if (username && !isValid)
    return (
      <p data-testid="CreateUsernameStatusDebug" className="mt-1 text-red-500">
        That username is taken!
      </p>
    );
  return <p data-testid="CreateUsernameStatusDebug"></p>;
}

export default SignUpPage;
