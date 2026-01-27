"use client";

import Typewriter from "typewriter-effect";

export default function HeaderTypewriter() {
    return (
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] text-foreground mix-blend-difference">
            <Typewriter
                options={{
                    autoStart: true,
                    loop: false,
                    delay: 60,
                    cursor: " ", // Transparent or space as we don't want a permanent blinking cursor after finish
                }}
                onInit={(typewriter) => {
                    typewriter
                        .typeString("SOFTWARE<br />DEVLOPER.")
                        .pauseFor(800)
                        .deleteChars(6) // Deletes "LOPER." leaving "SOFTWARE<br />DEV"
                        .typeString("ELOPER.") // Result: "SOFTWARE<br />DEVELOPER."
                        .pauseFor(800)
                        .deleteChars(10) // Deletes "DEVELOPER." leaving "SOFTWARE<br />"
                        .typeString("ENGINEER.")
                        .start();
                }}
            />
        </h1>
    );
}
