import type { TemplateRecipe } from "./template-types";
import {
  templateItem,
  templateCover,
  templateChart,
  templateContent,
} from "./template-content";

/** Original business, product and communications deck narratives; sample evidence is explicitly illustrative. */
export const businessTemplates: readonly TemplateRecipe[] = [
  {
    id: "venture-signal",
    name: "Venture Signal",
    domain: "Startup pitch",
    description:
      "A crisp investor story from customer friction to a focused funding ask.",
    palette: ["#101A2D", "#F4F7FC", "#A3E635", "#64C7E8"],
    font: "Arial",
    slides: [
      templateCover(
        "Less busywork. More momentum.",
        "An illustrative pitch for a workspace that gives small teams their time back.",
        "Seed story / Fold Labs",
      ),
      templateContent(
        "statement",
        "The work between the work is growing.",
        "Teams should spend their energy making progress, not reconstructing what happened.",
        [
          templateItem("Today", "Scattered decisions"),
          templateItem("The cost", "Lost context"),
          templateItem("Our opening", "One shared thread"),
        ],
      ),
      templateContent(
        "process",
        "Turn scattered context into a clear next step.",
        "One simple loop turns everyday work into shared momentum.",
        [
          templateItem(
            "Capture",
            "Bring decisions, files and conversations into one place.",
          ),
          templateItem(
            "Connect",
            "Link the work to a team goal and accountable owner.",
          ),
          templateItem("Move", "Make the next action visible to everyone."),
        ],
      ),
      templateChart(
        "line",
        "A small pilot is showing a useful signal.",
        "Illustrative active teams, not a measured traction claim. Replace with verified cohorts before presenting.",
        ["Jan", "Feb", "Mar", "Apr", "May"],
        [{ name: "Active teams (sample)", values: [12, 21, 39, 64, 98] }],
      ),
      templateContent(
        "matrix",
        "A focused business with room to expand.",
        "Start with one team workflow; earn the right to serve the whole organization.",
        [
          templateItem("Buyer", "Operations leads at growing companies."),
          templateItem("Model", "Workspace subscription, billed per team."),
          templateItem("Advantage", "Context stays attached to decisions."),
          templateItem("Team", "Product, engineering and customer success."),
        ],
      ),
      templateContent(
        "cta",
        "Build the next chapter with us.",
        "Illustrative ask: $1.5M to validate retention, refine the product and repeat the sales motion.",
        [
          templateItem("Next 90 days", "Complete the next customer cohort."),
          templateItem("Six months", "Demonstrate repeatable team retention."),
          templateItem("Twelve months", "Expand through customer referrals."),
        ],
      ),
    ],
  },
  {
    id: "boardroom-brief",
    name: "Boardroom Brief",
    domain: "Board decision",
    description:
      "A quiet editorial board deck with a clear decision, evidence and accountable next step.",
    palette: ["#F3F1EB", "#17213A", "#B58B3D", "#527780"],
    font: "Georgia",
    slides: [
      templateCover(
        "A focused investment in service reliability.",
        "Decision brief · approve a staged operating improvement, subject to validated assumptions.",
        "Board meeting / Example Group",
      ),
      templateContent(
        "metrics",
        "Three signals frame the decision.",
        "Illustrative Q3 measures; replace with your reporting period and source.",
        [
          templateItem("Service level", "Stable, with room to improve.", "94%"),
          templateItem("Cost per case", "Lower than the prior quarter.", "$18"),
          templateItem("Open backlog", "Needs a targeted response.", "420"),
        ],
      ),
      templateChart(
        "column",
        "Performance is improving; capacity remains tight.",
        "Plan and actual are comparable sample service levels (%). The gap guides where to invest first.",
        ["Q1", "Q2", "Q3"],
        [
          { name: "Plan (%)", values: [94, 95, 96] },
          { name: "Actual (%)", values: [89, 92, 94] },
        ],
      ),
      templateContent(
        "compare",
        "Choose the smallest credible intervention.",
        "Commercial options are illustrative and exclude tax and implementation risk.",
        [
          templateItem(
            "Maintain",
            "Hold investment; accept a longer recovery.",
          ),
          templateItem(
            "Stage the work",
            "Fund one service lane, then review the evidence.",
          ),
          templateItem(
            "Transform now",
            "Move faster with a larger execution burden.",
          ),
        ],
      ),
      templateContent(
        "matrix",
        "Make the risks and safeguards explicit.",
        "Use words as well as color to communicate status.",
        [
          templateItem(
            "Capacity / watch",
            "Reserve an owner and delivery time.",
          ),
          templateItem("Adoption / watch", "Pilot with one operating team."),
          templateItem(
            "Cost / controlled",
            "Set a spend gate before phase two.",
          ),
          templateItem(
            "Service / controlled",
            "Monitor a weekly quality threshold.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Approve the pilot, with a review gate.",
        "Decision requested: authorize the first stage and return with measured evidence before expanding.",
        [
          templateItem("Accountable owner", "Operations lead."),
          templateItem("Review date", "Six weeks after pilot start."),
          templateItem(
            "Success condition",
            "Service improves within the agreed cost envelope.",
          ),
        ],
      ),
    ],
  },
  {
    id: "revenue-pulse",
    name: "Revenue Pulse",
    domain: "Quarterly business review",
    description:
      "An evidence-led commercial review with metrics, trends and segment performance.",
    palette: ["#F5F8FF", "#14224D", "#2F63D8", "#12A89A"],
    font: "Arial",
    slides: [
      templateCover(
        "A stronger quarter. A clearer next move.",
        "Illustrative Q3 commercial review · growth with a more disciplined operating rhythm.",
        "QBR / Northline",
      ),
      templateContent(
        "metrics",
        "Growth is supported by healthier fundamentals.",
        "Sample Q3 figures, compared with the prior quarter; USD, excluding tax.",
        [
          templateItem("Revenue", "Illustrative quarterly revenue.", "$2.4M"),
          templateItem("Retention", "Illustrative gross retention.", "93%"),
          templateItem("Margin", "Illustrative gross margin.", "68%"),
        ],
      ),
      templateChart(
        "line",
        "Recurring revenue is growing steadily.",
        "Sample monthly recurring revenue, USD thousands. The line shows one consistent unit and period.",
        ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
        [{ name: "MRR ($k, sample)", values: [510, 560, 590, 650, 710, 800] }],
      ),
      templateChart(
        "bar",
        "Expansion is strongest in the core segment.",
        "Sample quarterly revenue, USD thousands. Compare segments on the same zero baseline.",
        ["Core teams", "Enterprise", "Partners"],
        [
          { name: "Q2 ($k)", values: [820, 580, 240] },
          { name: "Q3 ($k)", values: [1120, 900, 380] },
        ],
      ),
      templateContent(
        "cards",
        "Concentrate effort where customers find value.",
        "Connect every growth driver to a practical intervention.",
        [
          templateItem(
            "Activation",
            "Shorten the path to the first shared result.",
          ),
          templateItem(
            "Expansion",
            "Help existing champions reach another team.",
          ),
          templateItem(
            "Efficiency",
            "Retire low-signal campaigns and reinvest.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Make the next quarter repeatable.",
        "Turn this review into a short set of owned commitments.",
        [
          templateItem("Sales", "Focus on two validated buyer segments."),
          templateItem(
            "Customer success",
            "Review early value with new accounts.",
          ),
          templateItem("Finance", "Track growth and margin together."),
        ],
      ),
    ],
  },
  {
    id: "product-horizon",
    name: "Product Horizon",
    domain: "Product roadmap",
    description:
      "An outcome-driven roadmap with a horizon motif and clear commitments versus exploration.",
    palette: ["#F5F3FF", "#272044", "#7556D8", "#F0B54A"],
    font: "Arial",
    slides: [
      templateCover(
        "Make the next step feel obvious.",
        "A product direction for teams moving from setup to everyday confidence.",
        "Product direction / Horizon",
      ),
      templateContent(
        "quote",
        "The user insight that sets our direction.",
        "“I can start a project. I lose confidence when I need to bring everyone along.”",
        [
          templateItem(
            "Illustrative participant",
            "Composite research example; replace with consented evidence.",
          ),
        ],
      ),
      templateContent(
        "cards",
        "Three principles guide the experience.",
        "Principles should make trade-offs easier, not add another checklist.",
        [
          templateItem(
            "Start small",
            "Give people a useful first result before asking for setup.",
          ),
          templateItem(
            "Show context",
            "Explain why a step matters at the moment it matters.",
          ),
          templateItem(
            "Invite together",
            "Make collaboration part of the core flow.",
          ),
        ],
      ),
      templateContent(
        "timeline",
        "A roadmap built around outcomes.",
        "Now is committed; next is planned; later is exploration.",
        [
          templateItem(
            "Now / committed",
            "Remove the largest activation obstacle.",
          ),
          templateItem(
            "Next / planned",
            "Help a team finish its first shared project.",
          ),
          templateItem("Later / explore", "Extend the workflow across teams."),
        ],
      ),
      templateChart(
        "line",
        "Measure durable use, not a launch spike.",
        "Illustrative weekly active teams. Replace with a cohort measure and agreed activation definition.",
        ["W1", "W2", "W3", "W4", "W5"],
        [{ name: "Active teams (sample)", values: [34, 38, 47, 55, 68] }],
      ),
      templateContent(
        "cta",
        "Align on the next useful outcome.",
        "Confirm the first commitment and the evidence needed to expand it.",
        [
          templateItem("Decision", "Approve the activation focus."),
          templateItem(
            "Dependency",
            "Reserve research and engineering capacity.",
          ),
          templateItem("Review", "Return with cohort evidence in six weeks."),
        ],
      ),
    ],
  },
  {
    id: "launch-studio",
    name: "Launch Studio",
    domain: "Product launch",
    description:
      "A bold offer story with oversized type, a sculptural SVG hero and a practical rollout.",
    palette: ["#15141A", "#FFF8F0", "#FF7759", "#C2AEFA"],
    font: "Arial",
    slides: [
      templateCover(
        "Meet the lighter way to get it done.",
        "Introducing Forma · an illustrative new service for simpler everyday work.",
        "Launch edition / Forma",
      ),
      templateContent(
        "statement",
        "Too much setup. Too little momentum.",
        "The best tools give people an early win, then make the next one easier.",
      ),
      templateContent(
        "split",
        "One focused experience, from start to finish.",
        "Forma brings the essentials into a calm, guided workspace.",
        [
          templateItem(
            "For individuals",
            "A useful first result in one sitting.",
          ),
          templateItem(
            "For teams",
            "A shared process that stays understandable.",
          ),
        ],
      ),
      templateContent(
        "cards",
        "Built around three meaningful differences.",
        "Explain the benefit before the feature.",
        [
          templateItem(
            "Less friction",
            "Start from a clear task rather than a blank system.",
          ),
          templateItem("More context", "Keep the reasoning beside the work."),
          templateItem(
            "A better handoff",
            "Give the next person a complete starting point.",
          ),
        ],
      ),
      templateContent(
        "timeline",
        "A launch that learns as it grows.",
        "A staged rollout keeps feedback close to the team.",
        [
          templateItem("Preview", "Invite a small, engaged customer group."),
          templateItem("Launch", "Show the product through a useful task."),
          templateItem("Expand", "Share verified customer outcomes."),
        ],
      ),
      templateContent(
        "cta",
        "Put the idea into someone’s hands.",
        "Replace this sample action with a real destination before sharing.",
        [
          templateItem("Try", "Offer a focused guided experience."),
          templateItem("Talk", "Invite a short product conversation."),
          templateItem("Learn", "Publish a clear getting-started guide."),
        ],
      ),
    ],
  },
  {
    id: "strategy-compass",
    name: "Strategy Compass",
    domain: "Annual strategy",
    description:
      "A directional strategy narrative with explicit choices, measurable priorities and a 90-day plan.",
    palette: ["#F8F6EF", "#1E3B35", "#347965", "#D79A39"],
    font: "Arial",
    slides: [
      templateCover(
        "Choose a direction. Make it matter.",
        "An illustrative annual strategy for a more focused customer experience.",
        "Strategy / Northstar",
      ),
      templateContent(
        "split",
        "The context has changed.",
        "Customers want a complete outcome with fewer handoffs and less complexity.",
        [
          templateItem(
            "External shift",
            "Value is judged by time to a useful result.",
          ),
          templateItem(
            "Internal reality",
            "Capacity must follow fewer priorities.",
          ),
        ],
      ),
      templateContent(
        "compare",
        "Three choices make the strategy concrete.",
        "Commit to a focused path; say what will wait.",
        [
          templateItem(
            "Serve deeply",
            "Improve the core customer journey first.",
          ),
          templateItem(
            "Simplify first",
            "Remove friction before adding breadth.",
          ),
          templateItem(
            "Prove value",
            "Expand after the outcome is repeatable.",
          ),
        ],
      ),
      templateContent(
        "cards",
        "Priorities that can guide weekly decisions.",
        "Each priority needs an accountable owner and a visible measure.",
        [
          templateItem(
            "Customer value",
            "Product lead · faster first useful result.",
          ),
          templateItem(
            "Operational focus",
            "Operations lead · fewer unresolved handoffs.",
          ),
          templateItem(
            "Healthy growth",
            "Commercial lead · stronger retention.",
          ),
        ],
      ),
      templateChart(
        "column",
        "Define the change before measuring it.",
        "Illustrative baseline and target scores out of 100. Targets are ambitions, not observed outcomes.",
        ["Activation", "Service", "Retention"],
        [
          { name: "Baseline (sample)", values: [55, 70, 76] },
          { name: "Target (sample)", values: [75, 85, 88] },
        ],
      ),
      templateContent(
        "cta",
        "Turn the direction into ninety days of work.",
        "Start with a few decisions that teams can act on immediately.",
        [
          templateItem("Days 1–30", "Confirm owners, measures and baselines."),
          templateItem("Days 31–60", "Run the first focused interventions."),
          templateItem("Days 61–90", "Review evidence and adjust the plan."),
        ],
      ),
    ],
  },
  {
    id: "client-proposal",
    name: "Client Proposal",
    domain: "Professional services",
    description:
      "An editorial services proposal with scope, delivery sequence and clearly differentiated options.",
    palette: ["#FCFAF5", "#233540", "#B86B45", "#7E9B94"],
    font: "Georgia",
    slides: [
      templateCover(
        "A clearer service, built together.",
        "An illustrative proposal for simplifying a customer onboarding journey.",
        "Project proposal / Fieldwork Studio",
      ),
      templateContent(
        "quote",
        "Start with the outcome the client needs.",
        "“We need customers to feel confident from the first conversation to their first result.”",
        [
          templateItem(
            "Illustrative client brief",
            "Example wording, not a real testimonial.",
          ),
        ],
      ),
      templateContent(
        "process",
        "A practical approach with visible checkpoints.",
        "Scope includes research, service design and a pilot; production implementation is excluded.",
        [
          templateItem(
            "Understand",
            "Map customer needs and operational constraints.",
          ),
          templateItem("Design", "Prototype the few moments that matter most."),
          templateItem(
            "Validate",
            "Pilot the journey and agree the next investment.",
          ),
        ],
      ),
      templateContent(
        "agenda",
        "A six-week path to a tested direction.",
        "Timing assumes access to stakeholders and agreed feedback windows.",
        [
          templateItem(
            "Discover",
            "Interviews and journey baseline.",
            "Weeks 1–2",
          ),
          templateItem("Shape", "Concepts and service blueprint.", "Weeks 3–4"),
          templateItem("Pilot", "Test, refine and hand over.", "Weeks 5–6"),
        ],
      ),
      templateContent(
        "compare",
        "Choose the right level of support.",
        "Illustrative USD fees, excluding tax and travel. Confirm final scope in an agreement.",
        [
          templateItem(
            "Essential / $12k",
            "Focused discovery and a prioritized plan.",
          ),
          templateItem(
            "Partner / $24k",
            "Discovery, design and a guided pilot.",
          ),
          templateItem(
            "Embedded / $36k",
            "The full project plus implementation support.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Agree the outcome. Set the first workshop.",
        "A useful starting point is a shared definition of success.",
        [
          templateItem("Confirm", "Scope, access and the commercial option."),
          templateItem("Appoint", "One decision owner on each side."),
          templateItem("Begin", "A joint kickoff and baseline review."),
        ],
      ),
    ],
  },
  {
    id: "campaign-spectrum",
    name: "Campaign Spectrum",
    domain: "Marketing campaign",
    description:
      "A colorful campaign deck connecting a central idea to audience, channels and measurement.",
    palette: ["#FFF4EF", "#341D34", "#E85D75", "#F4B63F"],
    font: "Arial",
    slides: [
      templateCover(
        "Make room for something better.",
        "An illustrative integrated campaign for a simpler everyday choice.",
        "Campaign concept / Spectrum",
      ),
      templateContent(
        "quote",
        "One audience tension gives the idea its energy.",
        "“I want to make a better choice without turning it into another project.”",
        [
          templateItem(
            "Illustrative audience voice",
            "A fictional composite used to demonstrate the format.",
          ),
        ],
      ),
      templateContent(
        "portfolio",
        "A creative system with one recognizable idea.",
        "Keep the promise consistent while the format changes.",
        [
          templateItem("The line", "Make room for better."),
          templateItem("The visual", "A bold opening in a crowded field."),
          templateItem("The action", "Try one small change today."),
        ],
      ),
      templateContent(
        "timeline",
        "Sequence the story across channels.",
        "Each phase has a different job in the customer journey.",
        [
          templateItem(
            "Spark interest",
            "Short, distinctive awareness creative.",
          ),
          templateItem(
            "Make it useful",
            "Practical examples and product proof.",
          ),
          templateItem(
            "Invite action",
            "A direct offer and a clear next step.",
          ),
        ],
      ),
      templateChart(
        "bar",
        "Allocate effort to the role each channel plays.",
        "Illustrative media allocation (% of budget). Replace with a validated channel plan.",
        ["Video", "Search", "Community", "Partners"],
        [{ name: "Budget share (%)", values: [35, 30, 20, 15] }],
      ),
      templateContent(
        "cta",
        "Launch with a learning plan.",
        "Prepare the creative, the destination and the measure together.",
        [
          templateItem(
            "Before launch",
            "Check message, links and accessibility.",
          ),
          templateItem(
            "During launch",
            "Review signal quality, not only reach.",
          ),
          templateItem("After launch", "Keep what changes customer behavior."),
        ],
      ),
    ],
  },
  {
    id: "brand-manifesto",
    name: "Brand Manifesto",
    domain: "Brand system",
    description:
      "A typographic brand story with beliefs, voice examples and an editable visual system.",
    palette: ["#F4EDE3", "#2D2926", "#C64A31", "#315C56"],
    font: "Georgia",
    slides: [
      templateCover(
        "Good things begin with a little space.",
        "An illustrative brand platform for a thoughtful independent studio.",
        "Brand foundations / Common Ground",
      ),
      templateContent(
        "statement",
        "Our promise is a feeling people can recognize.",
        "We make complex things feel human, useful and quietly confident.",
      ),
      templateContent(
        "cards",
        "Three qualities keep the brand recognizable.",
        "Personality becomes useful when it changes a real design or writing choice.",
        [
          templateItem("Warm", "Speak with care and concrete language."),
          templateItem("Clear", "Make the useful idea easy to find."),
          templateItem("Curious", "Leave room for discovery and dialogue."),
        ],
      ),
      templateContent(
        "portfolio",
        "An identity with room to breathe.",
        "Natural texture, warm color and a clear editorial voice.",
        [
          templateItem("Warm paper", "#F4EDE3 · generous negative space."),
          templateItem("Terracotta", "#C64A31 · a purposeful visual accent."),
          templateItem("Deep green", "#315C56 · a quiet secondary voice."),
        ],
      ),
      templateContent(
        "compare",
        "The voice is helpful before it is clever.",
        "Example copy shows how the principles change everyday communication.",
        [
          templateItem("Before", "Optimize your synergistic workflow."),
          templateItem("Our voice", "Make the next step easier."),
          templateItem(
            "Why it works",
            "Concrete, useful and easy to remember.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Consistency is a practice.",
        "Use the same few principles across the places people meet the brand.",
        [
          templateItem("Write", "Start with the reader’s next useful step."),
          templateItem("Design", "Give the main idea enough space."),
          templateItem("Review", "Choose clarity over another flourish."),
        ],
      ),
    ],
  },
  {
    id: "research-lens",
    name: "Research Lens",
    domain: "Customer research",
    description:
      "A grounded research readout that separates method, observation, interpretation and experiments.",
    palette: ["#FAF8F1", "#20332C", "#557C5A", "#D5AA58"],
    font: "Arial",
    slides: [
      templateCover(
        "Where confidence breaks in the first week.",
        "An illustrative research readout on a new customer’s path to their first useful result.",
        "Research readout / Field Notes",
      ),
      templateContent(
        "matrix",
        "A small study with a clear boundary.",
        "Illustrative study design; replace with your actual recruitment and method.",
        [
          templateItem("Question", "What helps a new team gain confidence?"),
          templateItem(
            "Sample",
            "Eight example participants across two roles.",
          ),
          templateItem("Method", "Task-based interviews and journey review."),
          templateItem(
            "Boundary",
            "Directional insight, not population estimates.",
          ),
        ],
      ),
      templateChart(
        "bar",
        "Handoffs create more friction than setup.",
        "Illustrative counts among eight participants. Small samples are shown as raw counts, not generalized percentages.",
        ["Team handoff", "Finding context", "Initial setup"],
        [{ name: "Participants reporting friction (n=8)", values: [7, 5, 3] }],
      ),
      templateContent(
        "quote",
        "Confidence grows when the next step is visible.",
        "“I don’t need more instructions. I need to know what happens after I invite the team.”",
        [
          templateItem(
            "Illustrative participant",
            "Fictional example; not a verbatim research quotation.",
          ),
        ],
      ),
      templateContent(
        "cards",
        "Three opportunities to test next.",
        "Interpretations should lead to a falsifiable experiment.",
        [
          templateItem(
            "Preview the path",
            "Show the first shared milestone before setup.",
          ),
          templateItem(
            "Carry context",
            "Attach a decision summary to the handoff.",
          ),
          templateItem(
            "Name the owner",
            "Make the next responsible person visible.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Test the smallest useful change.",
        "The next study should challenge the recommendation, not just confirm it.",
        [
          templateItem("Prototype", "One guided team handoff."),
          templateItem("Observe", "Can participants explain the next step?"),
          templateItem("Decide", "Keep, revise or stop based on evidence."),
        ],
      ),
    ],
  },
];
