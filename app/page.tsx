"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isErrorState, setIsErrorState] = useState(false);
  const [infoMessage, setInfoMessage] = useState(
    "Sent out weekly on Sundays. Always free."
  );

  const searchParams = useSearchParams();

  useEffect(() => {
    const queryParam = searchParams.get("approved");

    if (queryParam === "true") {
      setIsSubscribed(true);
      setInfoMessage("See you soon in the email! Best for now!");
    }
    setIsLoading(false);
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inputValue }),
      });

      const result = await response.json();
      if (result.data === "Success") {
        setIsEmailSubmitted(true);
        setInfoMessage("The link should be in your email shortly.");
        setIsLoading(false);
      } else {
        setIsErrorState(true);
        setInfoMessage(result.error || "An error occurred.");
        setIsLoading(false);
      }
    } catch (error) {
      setInfoMessage("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen ">
      {isLoading ? (
        <Image
          className="w-auto"
          src={"/loading.gif"}
          alt="loading"
          width={80}
          height={80}
        ></Image>
      ) : (
        <div className="flex flex-col items-center justify-center text-center max-w-[650px] min-h-[350px] p-10 space-y-6">
          <Image
            className="w-auto"
            src={
              isSubscribed
                ? "/subscribed.png"
                : isEmailSubmitted
                ? "/approval.png"
                : isErrorState
                ? "/error.png"
                : "/unsubscribed.png"
            }
            alt="logo"
            width={100}
            height={100}
          />
          <h1 className="text-2xl font-bold">
            {isSubscribed
              ? "You are all set! Thank you!"
              : isEmailSubmitted
              ? "Verification email sent!"
              : isErrorState
              ? "Subscription failed!"
              : "Subscribe to My Newsletter"}
          </h1>
          <p className="text-lg text-gray-700">
            {isSubscribed
              ? "The verification was successful and I'm sure this is a great beginning for something special."
              : isEmailSubmitted
              ? "Double opt-in ensures that only valid and genuinely interested subscribers are added to my mailing list."
              : isErrorState
              ? "Unfortunately, your email was not added to the newsletter list due to reason in the warning message."
              : "Join the subscribers list to get the latest news, updates, and special offers delivered directly to your inbox."}
          </p>
          {!isEmailSubmitted && !isSubscribed && !isErrorState ? (
            <form
              className="flex flex-col sm:flex-row w-full px-4 space-y-2 sm:space-y-0 sm:space-x-2"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                placeholder="Enter your email"
                className="flex-grow border border-gray-300 p-2 sm:w-8/12 rounded focus:outline-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                required
              />
              <button
                className="w-full sm:w-4/12 bg-teal-500 text-white p-2 hover:bg-teal-600 rounded"
                type="submit"
              >
                Subscribe
              </button>
            </form>
          ) : (
            <button
              className="w-full bg-teal-500 text-white p-2 hover:bg-teal-600 rounded"
              type="button"
              onClick={() => {
                setIsSubscribed(false);
                setIsEmailSubmitted(false);
                setIsErrorState(false);
                setInfoMessage("Sent out weekly on Sundays. Always free.");
              }}
            >
              {isErrorState ? "Let me try again" : "Back to start"}
            </button>
          )}
          {!isErrorState ? (
            <p className="text-md text-gray-700">{infoMessage}</p>
          ) : (
            <p className="text-md text-red-500">{infoMessage}</p>
          )}
        </div>
      )}
    </main>
  );
}
