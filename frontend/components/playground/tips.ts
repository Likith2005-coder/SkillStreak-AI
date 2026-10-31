/**
 * "Did you know?" facts, per domain. A static, hand-picked list (no LLM call
 * per page load). The dashboard mascot rotates through them in its speech
 * bubble.
 */

const TIPS: Record<string, string[]> = {
  "web-development": [
    "The first website ever made, info.cern.ch from 1991, is still online and still loads.",
    "A <button> gets keyboard focus, Enter and Space support for free. A clickable <div> gets none of it.",
    "HTTP/3 runs over UDP, not TCP, so one lost packet no longer stalls every other request.",
    "CSS `gap` works in flexbox too, not just grid. No more margin hacks on the last child.",
  ],
  cybersecurity: [
    "\"123456\" has topped leaked-password lists for over a decade.",
    "Many breaches start with a person, not an exploit: phishing remains one of the most common ways in.",
    "The CIA triad is Confidentiality, Integrity and Availability. Every control protects at least one.",
    "A hash is one-way; encryption is two-way. Passwords should be hashed (with a salt), never encrypted.",
  ],
  "artificial-intelligence": [
    "The term \"artificial intelligence\" was coined in 1956 for a summer workshop at Dartmouth.",
    "Large language models predict the next token. Everything else they do falls out of that one task.",
    "AlphaGo's famous move 37 in 2016 was one it estimated a human would play only 1 time in 10,000.",
    "A model's \"temperature\" controls randomness: 0 is near-deterministic, higher values get creative.",
  ],
  "machine-learning": [
    "If your model scores 99% on training data and 60% on test data, it memorised rather than learned.",
    "Gradient descent just walks downhill on the loss surface, one small step at a time.",
    "Most real ML time goes into cleaning and labelling data, not choosing the model.",
    "A random forest is many decision trees voting; the crowd beats any single tree.",
  ],
  "data-science": [
    "Anscombe's quartet: four datasets with identical means and correlations that look nothing alike when plotted.",
    "Correlation is not causation: ice-cream sales and shark attacks both rise in summer.",
    "The median resists outliers; the mean doesn't. One billionaire moves the mean salary of a town.",
    "Pandas got its name from \"panel data\", an econometrics term.",
  ],
  "cloud-computing": [
    "\"The cloud\" is someone else's data centre, rented by the second.",
    "Availability zones are separate buildings with their own power, so one fire can't take you down.",
    "Serverless still has servers; you just never patch or scale them yourself.",
    "Egress (data leaving the cloud) is usually what surprises people on the bill.",
  ],
  devops: [
    "Docker containers share the host's kernel, which is why they start in milliseconds and VMs don't.",
    "Elite teams deploy many times a day; small changes are easier to ship and to roll back.",
    "\"Works on my machine\" is the bug that containers were invented to kill.",
    "Infrastructure as code means your servers get code review, history and rollbacks too.",
  ],
  blockchain: [
    "Bitcoin's first block (the genesis block) quotes a 2009 newspaper headline about bank bailouts.",
    "A blockchain is an append-only ledger; each block stores the hash of the one before it.",
    "Smart contracts are just programs that run on every node, so every line costs gas.",
    "Proof of stake cut Ethereum's energy use by roughly 99.9% after the 2022 Merge.",
  ],
  iot: [
    "There are now more connected IoT devices on Earth than people.",
    "MQTT, a common IoT protocol, was designed in 1999 to monitor oil pipelines over satellite.",
    "Default passwords on cameras and routers powered the Mirai botnet, which knocked big sites offline in 2016.",
    "Edge computing processes data on the device so it doesn't have to round-trip to the cloud.",
  ],
};

const GENERIC = [
  "Testing yourself beats re-reading: recall practice is one of the best-proven ways to remember.",
  "Spacing practice over days beats cramming the same hours in one sitting.",
  "Explaining a topic in your own words (the Feynman technique) shows exactly where the gaps are.",
  "Mistakes you correct stick better than answers you got right the first time.",
];

/** The facts for a domain, or general learning-science facts without one. */
export function tipsFor(domainSlug?: string): string[] {
  return (domainSlug && TIPS[domainSlug]) || GENERIC;
}
