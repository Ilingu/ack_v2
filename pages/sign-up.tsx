/* eslint-disable react-hooks/exhaustive-deps */
import {
  FC,
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
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, writeBatch } from "@firebase/firestore";
import debounce from "lodash.debounce";
// UI
import MetaTags from "../components/Metatags";
import Divider from "../components/Divider";
import { UserContext } from "../lib/context";
import toast from "react-hot-toast";
// Icon
import { FcGoogle } from "react-icons/fc";
import { FaTwitter, FaSignOutAlt } from "react-icons/fa";
import { AiFillGithub } from "react-icons/ai";
// Types
import { ConnMethods } from "../lib/types/types";

/* Var */
const GoogleProvider = new GoogleAuthProvider();
const TwitterProvider = new TwitterAuthProvider();
const GithubProvider = new GithubAuthProvider();

/* Components */
const SignUpPage: FC = () => {
  const { user, username } = useContext(UserContext);

  return (
    <Fragment>
      <MetaTags title="ACK:Sign up" description="Sign up Page for ACK" />
      <main className="w-screen h-screen flex flex-col justify-center items-center">
        <div className="bg-gray-700 text-primary h-4/6 w-1/4 py-4 px-4 rounded-lg shadow-lg flex flex-col justify-center items-center">
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
      <h1 className="font-bold text-2xl tracking-wide">Already Sign-in!</h1>
      <button
        onClick={() => auth.signOut()}
        className="mt-4 py-2 px-2 bg-red-400 text-gray-50 font-semibold text-lg rounded-md"
      >
        <FaSignOutAlt className="inline" />
        Sign Out
      </button>
    </Fragment>
  );
}

function SignInButton() {
  const signIn = async (method: ConnMethods) => {
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
        `Welcome ${auth.currentUser.displayName}! Successfully Sign in with ${method}.`
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
          className="bg-gray-700 rounded-full"
        />
        <h1 className="text-center text-4xl font-bold mb-6">Sign In/Up</h1>
        <Divider />
      </header>
      <aside className="shadow-2xl w-3/4 h-1/3 py-2 rounded-lg flex flex-col justify-evenly items-center">
        <button
          onClick={() => signIn("google")}
          className="py-2 px-2 bg-gray-100 rounded text-gray-900 outline-none focus:ring-4 focus:ring-offset-2 
          focus:ring-gray-100 hover:bg-gray-300 transition text-xl w-5/6 font-semibold mb-4"
        >
          <FcGoogle className="inline" /> Google
        </button>
        <button
          onClick={() => signIn("twitter")}
          className="py-2 px-2 bg-gray-100 rounded text-gray-900 outline-none focus:ring-4 focus:ring-offset-2 
          focus:ring-gray-100 hover:bg-gray-300 transition text-xl w-5/6 font-semibold mb-4"
        >
          <FaTwitter className="inline text-blue-500" /> Twitter
        </button>
        <button
          onClick={() => signIn("github")}
          className="py-2 px-2 bg-gray-800 rounded text-gray-50 outline-none focus:ring-4 focus:ring-offset-2 
          focus:ring-gray-800 hover:bg-gray-600 transition text-xl w-5/6 font-semibold"
        >
          <AiFillGithub className="inline" /> Github
        </button>
      </aside>
    </Fragment>
  );
}

function UsernameForm() {
  const [formValue, setFormValue] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext);

  useEffect(() => {
    checkUsername(formValue);
  }, [formValue]);

  const onChange = (e) => {
    const val = e.target.value.toLowerCase();
    const re = /^(?=[a-zA-Z0-9._]{3,15}$)(?!.*[_.]{2})[^_.].*[^_.]$/;
    if (val.length < 3) {
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

  const onSubmit = async (e) => {
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
      if (username.length >= 3) {
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
        <h1 className="text-center text-4xl font-bold mb-6">Choose Username</h1>
        <hr />
      </header>
      <form onSubmit={onSubmit} className="flex flex-col items-center">
        <input
          type="text"
          name="username"
          placeholder="username"
          value={formValue}
          onChange={onChange}
          className="w-full py-2 pl-2 rounded-lg text-xl outline-none text-black focus:ring-4 focus:ring-offset-2 focus:ring-yellow-400 transition"
        />

        <UsernameMessage
          isValid={isValid}
          username={formValue}
          loading={loading}
        />

        <div className="w-full">
          <button
            type="submit"
            className="w-4/6 text-gray-800 mt-2 py-2 px-2 bg-green-300 rounded outline-none focus:ring-4 focus:ring-offset-2  
          focus:ring-green-200 hover:bg-green-200 transition text-xl font-semibold"
            disabled={!isValid}
          >
            Choose
          </button>
          <button
            type="submit"
            className="w-2/6 text-gray-800 mt-1 py-2 px-2 bg-red-400 rounded outline-none focus:ring-4 focus:ring-offset-2 
          focus:ring-green-200 hover:bg-red-200 transition text-xl font-semibold"
            onClick={() => auth.signOut()}
          >
            Cancel
          </button>
        </div>

        <h3 className="font-semibold text-lg text-gray-50 mt-4">Debug State</h3>
        <hr className="w-1/2" />
        <div className="text-gray-50">
          Username:{" "}
          <span className="text-gray-300 font-medium">{formValue}</span>
          <br />
          Loading:{" "}
          <span className="text-gray-300 font-medium">
            {loading.toString()}
          </span>
          <br />
          Username Valid:{" "}
          {isValid ? (
            <span className="text-green-500 font-medium">true</span>
          ) : (
            <span className="text-red-500 font-medium">false</span>
          )}
        </div>
      </form>
    </div>
  );
}

function UsernameMessage({ username, isValid, loading }) {
  if (loading) return <p className="mt-1">Checking...</p>;
  if (isValid)
    return <p className="text-green-500 mt-1">{username} is available!</p>;
  if (username && !isValid)
    return <p className="text-red-500 mt-1">That username is taken!</p>;
  return <p></p>;
}

export default SignUpPage;
