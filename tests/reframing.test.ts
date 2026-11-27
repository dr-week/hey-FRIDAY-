import { expect, test } from "bun:test";
import { reframeUtterance } from "../desktop-ui/src/departments/reframing/grammarReframer.ts";
import { mathSkill } from "../desktop-ui/src/departments/conversation/assistantSkills.ts";

const r = (s: string) => reframeUtterance(s).reframed.toLowerCase();

test("self-correction keeps the repair clause", () => {
  expect(r("um hey friday can you can you like mute the audio no wait actually increase the volume")).toContain("increase the volume");
  expect(r("check weather in mumbai sorry I mean goa")).toContain("goa");
  expect(r("check weather in mumbai sorry I mean goa")).not.toContain("mumbai");
});

test("broken grammar maps to a clean frame", () => {
  expect(r("friday today umbrella goa rain tell me please")).toBe("do i need an umbrella in goa today?");
  expect(r("uh so basically my my battery how much left check")).toBe("check system status");
});

test("calculator", () => {
  expect(mathSkill("what is 48 times 16")?.reply).toContain("768");
  expect(mathSkill("20 percent of 150")?.reply).toContain("30");
});

import { toSearchTopic, isKnowledgeQuestion } from "../desktop-ui/src/departments/knowledge/webKnowledge.ts";

test("knowledge question detection + topic extraction", () => {
  expect(isKnowledgeQuestion("who is APJ Abdul Kalam")).toBe(true);
  expect(isKnowledgeQuestion("mute audio")).toBe(false);
  expect(toSearchTopic("who is APJ Abdul Kalam?")).toBe("APJ Abdul Kalam");
  expect(toSearchTopic("tell me about black holes")).toBe("black holes");
});
