---
layout: project
type: project
image: images/micromouse.png
title: Micromouse
permalink: projects/micrmouse
# All dates must be YYYY-MM-DD format!
date: 2019-01-15
labels:
  - Microchip programming 
  - Team design
  - Autonomous
  - Algorithms
summary: Micromouse is a project that has students program and design an autonomous robot that is capable of tracking and mapping the fastest route to the goal (center of a maze).
---

As a 296 project, my team took on Micromouse. Micromouse is a project where the objective is to have students program and design an autonomous robot that is capable of tracking and mapping the fastest route to the goal (center of a maze). Designing a PCB, we took into consideration the microchip, motors, and IR sensors we would be using. Planning everything with EAGLE pcb design software, we shipped out our design to process a couple boards in China. Reciving the parts we got to work. Soldering everything down took some time and extra parts were found on island.

Putting everything together, the rest was software. Taking the flood fill algorithm, basic motor movement, and a margin of error controller into consideration, we attempted to build what we thought ultimately get us to the end goal. The hardest part of software was reading in signals from the IR sensors. Having to adjust resistor values to get input values that could track the distance from our micromouse to the nearest wall took a lot of time. Once the mouse was on we were not allowed to touch it after it started tracking and mapping so it needed to make minor movement adjustments if the left side and right side sensors were not even (meaning that the robot was not fully centered within the maze). Another problem we encountered in this stage was turning as the IR sensors sometimes read different values depending on the light in the room. It would need to test and check if the continuous value was correct or incorrect with a p controller. We also needed a translater from continuous signal to discrete so that we could read in values.

Sadly, we were unable to complete our goal as half of our team stopped showing up and were unable to deliver on their end. Hardware started failing, adjustments had to be made and everything ended up in a mess. This project taught the remaining two of the existing team important life lessons. We spent countless hours in the lab trying to provide a deliverable and in the end the only thing you can really ask of yourself is to put your best foot forward. We put in the time into building and researching and although this may have not been our proudest production, we now understand that even if some people in a group are unable to deliver, others may have to pick up the slack and just power through. Regardless of the problem, the problem still needs to be solved.
