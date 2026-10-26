import type { TemplateRecipe } from "./template-types";
import {
  templateItem,
  templateCover,
  templateChart,
  templateContent,
} from "./template-content";

/** Original education, health, public-interest and architectural narratives with honest illustrative evidence. */
export const knowledgeTemplates: readonly TemplateRecipe[] = [
  {
    id: "academic-defense",
    name: "Academic Defense",
    domain: "Thesis defense",
    description:
      "A scholarly argument with a clear research gap, method, figure, limitations and contribution.",
    palette: ["#FFFFFF", "#172A50", "#336EA8", "#8A6B40"],
    font: "Georgia",
    slides: [
      templateCover(
        "Designing for confident collaboration.",
        "An illustrative thesis defense · a study of context, coordination and shared work.",
        "Research defense / Example University",
      ),
      templateContent(
        "split",
        "The gap is between knowing and coordinating.",
        "Existing tools explain individual tasks well. Shared understanding at handoff remains less visible.",
        [
          templateItem(
            "Research question",
            "How does visible context affect coordination?",
          ),
          templateItem(
            "Contribution sought",
            "A testable model of confident handoff.",
          ),
        ],
      ),
      templateContent(
        "process",
        "A method that connects observation and testing.",
        "Illustrative design only; replace with approved research methods and participant details.",
        [
          templateItem("Observe", "Map breakdowns in a bounded workflow."),
          templateItem("Model", "Define the context needed at each handoff."),
          templateItem("Evaluate", "Compare a prototype with the baseline."),
        ],
      ),
      templateChart(
        "column",
        "Figure 1. A directional result worth examining.",
        "Illustrative task completion (%), two example conditions. These values do not establish significance.",
        ["Task A", "Task B", "Task C"],
        [
          { name: "Baseline (%)", values: [58, 62, 54] },
          { name: "Prototype (%)", values: [73, 78, 70] },
        ],
      ),
      templateContent(
        "matrix",
        "Interpret the result within its limits.",
        "Evidence becomes stronger when the constraints remain visible.",
        [
          templateItem(
            "Observation",
            "Completion improved in the example tasks.",
          ),
          templateItem(
            "Interpretation",
            "Visible context may reduce uncertainty.",
          ),
          templateItem("Limitation", "Small sample and a controlled setting."),
          templateItem("Next test", "Evaluate transfer to everyday teamwork."),
        ],
      ),
      templateContent(
        "cta",
        "A contribution to how teams coordinate.",
        "The central proposition: a useful handoff carries reasoning, ownership and the next action.",
        [
          templateItem("Model", "A vocabulary for handoff context."),
          templateItem(
            "Practice",
            "A design pattern to test in real settings.",
          ),
          templateItem(
            "Discussion",
            "Which assumptions need the strongest challenge?",
          ),
        ],
      ),
    ],
  },
  {
    id: "lesson-spark",
    name: "Lesson Spark",
    domain: "Classroom lesson",
    description:
      "A lively, readable lesson with one objective, a worked example, practice and an answer in notes.",
    palette: ["#FFF9E9", "#213B4A", "#E7A22A", "#3A8F9B"],
    font: "Arial",
    slides: [
      templateCover(
        "What makes a comparison fair?",
        "A short lesson on reading charts and comparing like with like.",
        "Learning spark / Data literacy",
      ),
      templateContent(
        "statement",
        "By the end, you can ask a better chart question.",
        "Check the unit, the time period and the baseline before deciding what a chart means.",
      ),
      templateContent(
        "cards",
        "Three checks make a comparison clearer.",
        "Use these questions whenever a number is used to persuade.",
        [
          templateItem(
            "Same unit?",
            "Are we comparing counts, percentages or money?",
          ),
          templateItem(
            "Same period?",
            "Does every number cover the same amount of time?",
          ),
          templateItem(
            "Fair baseline?",
            "Does the visual length match the size of the difference?",
          ),
        ],
      ),
      templateChart(
        "column",
        "Worked example: compare the same week.",
        "Fictional books borrowed by two classes. Both bars start at zero and use the same unit.",
        ["Class A", "Class B"],
        [{ name: "Books borrowed (sample)", values: [18, 24] }],
      ),
      templateContent(
        "matrix",
        "Try it: which questions would you ask?",
        "Discuss the examples with a partner. Suggested answers are in the speaker notes.",
        [
          templateItem(
            "Sales rose 20%",
            "Twenty percent of what starting value?",
          ),
          templateItem(
            "Team A is faster",
            "Was the task and timing method the same?",
          ),
          templateItem(
            "This bar is twice as tall",
            "Does the axis begin at zero?",
          ),
          templateItem(
            "Our average improved",
            "Who is included, and what changed?",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Be curious before being convinced.",
        "A chart is a starting point for a useful question.",
        [
          templateItem("Remember", "Unit, period and baseline."),
          templateItem(
            "Practice",
            "Find one chart and explain its comparison.",
          ),
          templateItem(
            "Reflect",
            "What information would change your conclusion?",
          ),
        ],
      ),
    ],
  },
  {
    id: "workshop-canvas",
    name: "Workshop Canvas",
    domain: "Team facilitation",
    description:
      "An editable workshop with timeboxes, clear prompts, a qualitative prioritization grid and commitments.",
    palette: ["#F6F1FF", "#342945", "#8A58BD", "#E99645"],
    font: "Arial",
    slides: [
      templateCover(
        "Make the next decision together.",
        "A 60-minute working session to turn a shared challenge into a focused next experiment.",
        "Workshop / Team canvas",
      ),
      templateContent(
        "agenda",
        "A useful hour, with room to think.",
        "Working agreements: listen fully, write concretely and keep the decision visible.",
        [
          templateItem(
            "Frame the challenge",
            "Align on the question.",
            "10 min",
          ),
          templateItem(
            "Generate options",
            "Think alone, then build together.",
            "20 min",
          ),
          templateItem(
            "Choose and commit",
            "Pick a test and an owner.",
            "30 min",
          ),
        ],
      ),
      templateContent(
        "statement",
        "Start alone. Make it specific.",
        "In five minutes, write three moments where the current experience makes work harder than it needs to be.",
      ),
      templateContent(
        "portfolio",
        "Build on what you hear.",
        "Example working notes; replace them with participant contributions.",
        [
          templateItem(
            "Lost context",
            "The next person cannot see the decision.",
          ),
          templateItem(
            "Slow start",
            "Setup arrives before the first useful result.",
          ),
          templateItem("Unclear owner", "Everyone waits for someone else."),
        ],
      ),
      templateContent(
        "matrix",
        "Prioritize with a qualitative grid.",
        "Discuss expected value and effort; these are judgments, not measured scores.",
        [
          templateItem(
            "High value / low effort",
            "Test first: a clearer handoff summary.",
          ),
          templateItem(
            "High value / high effort",
            "Plan: a shared workflow redesign.",
          ),
          templateItem("Low value / low effort", "Batch: small wording fixes."),
          templateItem(
            "Low value / high effort",
            "Avoid: rebuilding without a clear need.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Leave with a test, not a longer list.",
        "Write the commitment where the team will actually revisit it.",
        [
          templateItem("Experiment", "One improved handoff in a live project."),
          templateItem("Owner", "Name the person who can move it forward."),
          templateItem(
            "Review",
            "Set a date and an observable success condition.",
          ),
        ],
      ),
    ],
  },
  {
    id: "onboarding-path",
    name: "Onboarding Path",
    domain: "Employee onboarding",
    description:
      "A welcoming first-month guide with essentials, working principles and visible support routes.",
    palette: ["#EFF8F5", "#183E36", "#28836D", "#D8A33B"],
    font: "Arial",
    slides: [
      templateCover(
        "Your first month, with a clearer path.",
        "Welcome to Common Ground · an illustrative guide to getting started and finding support.",
        "Welcome / People team",
      ),
      templateContent(
        "cards",
        "How we work together.",
        "A few everyday behaviors make the culture visible.",
        [
          templateItem(
            "Share context",
            "Explain the reason behind the request.",
          ),
          templateItem("Ask early", "A useful question is a contribution."),
          templateItem(
            "Close the loop",
            "Make decisions and next actions easy to find.",
          ),
        ],
      ),
      templateContent(
        "agenda",
        "The first-week essentials.",
        "Sample checklist; replace with your actual systems, policies and access steps.",
        [
          templateItem(
            "Set up access",
            "Required: accounts and security guidance.",
            "Day 1",
          ),
          templateItem(
            "Meet your team",
            "Required: roles, goals and a buddy.",
            "Days 2–3",
          ),
          templateItem(
            "Make a small contribution",
            "Optional: a guided first task.",
            "Days 4–5",
          ),
        ],
      ),
      templateContent(
        "matrix",
        "You do not need to figure it out alone.",
        "Role labels are examples; add verified contacts before sharing.",
        [
          templateItem(
            "Your manager",
            "Priorities, expectations and feedback.",
          ),
          templateItem("Your buddy", "Everyday questions and team context."),
          templateItem("People support", "Policies, benefits and wellbeing."),
          templateItem("IT support", "Access, devices and technical help."),
        ],
      ),
      templateContent(
        "timeline",
        "A month of growing confidence.",
        "Progress means understanding the work and knowing where to ask.",
        [
          templateItem(
            "Week 1 / orient",
            "Learn the people, tools and immediate goal.",
          ),
          templateItem(
            "Week 2 / contribute",
            "Finish a small, supported piece of work.",
          ),
          templateItem(
            "Weeks 3–4 / connect",
            "Own a result and reflect with your manager.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Start with one conversation.",
        "Use your next check-in to make the first week feel manageable.",
        [
          templateItem("Ask", "What would a useful first result look like?"),
          templateItem("Confirm", "Where should questions and decisions go?"),
          templateItem("Connect", "Who can help when you get stuck?"),
        ],
      ),
    ],
  },
  {
    id: "clinical-evidence",
    name: "Clinical Evidence",
    domain: "Clinical study readout",
    description:
      "A careful evidence narrative with population, outcomes, safety, limitations and a validation plan.",
    palette: ["#F7FBFD", "#17384A", "#207E9B", "#76639C"],
    font: "Arial",
    slides: [
      templateCover(
        "A clear question. A careful interpretation.",
        "Illustrative service evaluation format · sample data, not clinical guidance.",
        "Evidence review / Example care team",
      ),
      templateContent(
        "matrix",
        "Define the population and the method.",
        "Replace every sample value with approved study information.",
        [
          templateItem(
            "Question",
            "Can a guided follow-up improve attendance?",
          ),
          templateItem(
            "Population",
            "Illustrative adults in one service setting.",
          ),
          templateItem(
            "Comparison",
            "Usual follow-up versus a guided pathway.",
          ),
          templateItem("Outcome", "Attendance within an agreed interval."),
        ],
      ),
      templateChart(
        "column",
        "Describe the result without overstating it.",
        "Illustrative attendance (%), equal sample denominators of 100 per group. No statistical inference is implied.",
        ["Usual follow-up", "Guided pathway"],
        [{ name: "Attendance (sample %)", values: [62, 74] }],
      ),
      templateContent(
        "cards",
        "Safety and limitations deserve equal attention.",
        "This format is a communication aid, not a recommendation for care.",
        [
          templateItem(
            "Safety",
            "Report adverse events and the observation window.",
          ),
          templateItem(
            "Uncertainty",
            "Include intervals and missingness when available.",
          ),
          templateItem(
            "Transferability",
            "Explain where the sample may not apply.",
          ),
        ],
      ),
      templateContent(
        "split",
        "A promising signal is a reason to validate.",
        "The example suggests a question for a stronger evaluation, not an immediate change in practice.",
        [
          templateItem(
            "For practice",
            "Keep current approved guidance in place.",
          ),
          templateItem(
            "For research",
            "Test the pathway with a suitable design.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Agree the next validation step.",
        "A useful decision names the evidence needed before any implementation.",
        [
          templateItem("Protocol", "Confirm measures, safety and governance."),
          templateItem("Evaluation", "Use a justified design and sample."),
          templateItem("Review", "Return to the responsible clinical group."),
        ],
      ),
    ],
  },
  {
    id: "public-health",
    name: "Public Health",
    domain: "Community intervention",
    description:
      "A clear community program brief connecting need, access, delivery and participation.",
    palette: ["#FFF9EF", "#263A43", "#D87537", "#2F8B8B"],
    font: "Arial",
    slides: [
      templateCover(
        "Make the healthy choice easier to reach.",
        "An illustrative community program brief focused on access and practical participation.",
        "Community plan / Open Door",
      ),
      templateChart(
        "bar",
        "Understand who is being missed.",
        "Illustrative service coverage (%), not regional health statistics. Replace with a verified local source.",
        ["Current users", "New residents", "Remote access"],
        [{ name: "Coverage (sample %)", values: [72, 49, 38] }],
      ),
      templateContent(
        "cards",
        "An intervention people can actually use.",
        "Describe the service in everyday actions.",
        [
          templateItem(
            "Find",
            "Make eligibility and locations easy to understand.",
          ),
          templateItem("Join", "Offer a simple, supported first contact."),
          templateItem("Continue", "Remove the largest follow-up barriers."),
        ],
      ),
      templateContent(
        "process",
        "Build access into delivery.",
        "A sample delivery model; confirm local routes and responsibilities.",
        [
          templateItem(
            "Community input",
            "Test the language and service journey.",
          ),
          templateItem("Local access", "Offer appropriate places and formats."),
          templateItem(
            "Supported follow-up",
            "Help participants take the next step.",
          ),
        ],
      ),
      templateContent(
        "metrics",
        "Measure reach and experience together.",
        "Illustrative program measures; do not substitute these for health outcomes.",
        [
          templateItem(
            "People reached",
            "Count unique participants, not impressions.",
            "Reach",
          ),
          templateItem(
            "Access completed",
            "Track the first useful service step.",
            "Access",
          ),
          templateItem(
            "Experience heard",
            "Invite feedback from missed groups.",
            "Voice",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Make participation a clear next step.",
        "Add verified service information and contact routes before distribution.",
        [
          templateItem("Learn", "Explain who the program is for."),
          templateItem(
            "Participate",
            "Name the first action and where to take it.",
          ),
          templateItem("Improve", "Provide a safe way to share feedback."),
        ],
      ),
    ],
  },
  {
    id: "climate-ledger",
    name: "Climate Ledger",
    domain: "Sustainability reporting",
    description:
      "A measured environmental plan with a reporting boundary, emissions profile, levers and accountability.",
    palette: ["#F1F4E9", "#233D30", "#5D7C41", "#C08F3C"],
    font: "Georgia",
    slides: [
      templateCover(
        "A smaller footprint. A more accountable plan.",
        "Illustrative environmental roadmap · baseline, reduction levers and a transparent review cycle.",
        "Climate plan / Example operations",
      ),
      templateContent(
        "matrix",
        "Start with a boundary people can understand.",
        "The sample boundary is fictional; confirm the reporting standard and source.",
        [
          templateItem("Reporting year", "Illustrative calendar year 2026."),
          templateItem("Organization", "Example owned sites and operations."),
          templateItem("Unit", "Metric tonnes of CO₂ equivalent."),
          templateItem(
            "Boundary",
            "Selected operational sources; not a full inventory.",
          ),
        ],
      ),
      templateChart(
        "bar",
        "Focus on the largest sources first.",
        "Illustrative operational emissions, tCO₂e. This is a sample profile, not a verified footprint.",
        ["Purchased energy", "Transport", "Materials"],
        [{ name: "Emissions (sample tCO₂e)", values: [480, 310, 210] }],
      ),
      templateContent(
        "cards",
        "Prioritize reductions before residual claims.",
        "Each lever needs a baseline, an owner and a method of verification.",
        [
          templateItem("Use less", "Improve energy and material efficiency."),
          templateItem("Change the source", "Evaluate lower-emission inputs."),
          templateItem(
            "Redesign the system",
            "Reduce avoidable movement and waste.",
          ),
        ],
      ),
      templateContent(
        "timeline",
        "A staged route from baseline to review.",
        "Targets are intentions until independently supported by evidence.",
        [
          templateItem(
            "Establish",
            "Confirm the inventory and reporting boundary.",
          ),
          templateItem("Implement", "Fund the most credible reduction levers."),
          templateItem(
            "Verify",
            "Measure change and explain remaining uncertainty.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Make the next report more useful.",
        "Accountability means explaining progress, limitations and what changes next.",
        [
          templateItem("Owner", "Assign responsibility for each lever."),
          templateItem("Review", "Publish the method and reporting period."),
          templateItem("Improve", "Revise the plan when the evidence changes."),
        ],
      ),
    ],
  },
  {
    id: "nonprofit-impact",
    name: "Nonprofit Impact",
    domain: "Donor and impact update",
    description:
      "A warm mission story with a clear distinction between activities, outcomes and responsible funding.",
    palette: ["#FFF5EC", "#49342B", "#CA704B", "#557F6C"],
    font: "Georgia",
    slides: [
      templateCover(
        "More possibility, one neighborhood at a time.",
        "An illustrative nonprofit update connecting community need with practical support.",
        "Impact story / Neighbourhood Works",
      ),
      templateContent(
        "statement",
        "A person’s next opportunity should not depend on luck.",
        "People need accessible support, useful connections and a place to begin.",
      ),
      templateContent(
        "process",
        "A program designed around the next useful step.",
        "The example program is fictional; replace with your actual delivery model.",
        [
          templateItem("Listen", "Understand the goal and the barriers."),
          templateItem(
            "Connect",
            "Offer practical guidance and trusted support.",
          ),
          templateItem(
            "Follow through",
            "Stay close as the person takes the next step.",
          ),
        ],
      ),
      templateChart(
        "column",
        "Show what was delivered, then ask what changed.",
        "Illustrative quarterly activity counts. Outputs are not proof of long-term impact.",
        ["Q1", "Q2", "Q3", "Q4"],
        [{ name: "Guided sessions (sample)", values: [80, 110, 145, 170] }],
      ),
      templateChart(
        "doughnut",
        "Explain how resources support the mission.",
        "Illustrative budget shares (%). Confirm the reporting period and allocation method.",
        ["Program delivery", "People and support", "Learning and operations"],
        [{ name: "Budget share (%)", values: [65, 23, 12] }],
      ),
      templateContent(
        "cta",
        "Help make the next opportunity possible.",
        "Connect a contribution with a real activity, without guaranteeing an individual outcome.",
        [
          templateItem("Support", "Fund the next round of practical sessions."),
          templateItem("Connect", "Introduce a relevant community partner."),
          templateItem(
            "Learn",
            "Ask how the program measures meaningful change.",
          ),
        ],
      ),
    ],
  },
  {
    id: "civic-plan",
    name: "Civic Plan",
    domain: "Public service proposal",
    description:
      "An accessible public-information deck with a service proposal, phases, budget and consultation.",
    palette: ["#F4F6F7", "#213C58", "#2D7296", "#B98B43"],
    font: "Arial",
    slides: [
      templateCover(
        "A simpler route to local services.",
        "An illustrative public service proposal for clearer information and fewer avoidable handoffs.",
        "Consultation proposal / Example district",
      ),
      templateContent(
        "split",
        "The current journey asks too much of residents.",
        "Information is distributed across channels, and the next responsible team is not always clear.",
        [
          templateItem("Resident need", "A clear first contact and next step."),
          templateItem("Service need", "Shared context across handoffs."),
        ],
      ),
      templateContent(
        "cards",
        "One service promise, three practical changes.",
        "This is a proposal for discussion, not an approved public commitment.",
        [
          templateItem(
            "Clear information",
            "Explain eligibility and next steps plainly.",
          ),
          templateItem(
            "Supported access",
            "Keep appropriate assisted routes available.",
          ),
          templateItem(
            "Connected delivery",
            "Carry context to the next responsible team.",
          ),
        ],
      ),
      templateContent(
        "timeline",
        "Implementation with public checkpoints.",
        "Illustrative sequence; replace dates and approval routes before use.",
        [
          templateItem("Listen / proposed", "Gather resident and staff input."),
          templateItem("Pilot / proposed", "Test a bounded service journey."),
          templateItem(
            "Review / proposed",
            "Publish findings before wider delivery.",
          ),
        ],
      ),
      templateChart(
        "bar",
        "Make the proposed investment understandable.",
        "Illustrative pilot budget, USD thousands. Values are examples, not approved allocations.",
        ["Service design", "Access support", "Technology", "Evaluation"],
        [{ name: "Proposed budget ($k, sample)", values: [45, 35, 55, 15] }],
      ),
      templateContent(
        "cta",
        "A clear question for the consultation.",
        "Would this proposal make the first service step easier, and who might still be excluded?",
        [
          templateItem("Respond", "Add the verified consultation channel."),
          templateItem("Participate", "Include accessible ways to contribute."),
          templateItem("Decide", "Publish the decision route and review date."),
        ],
      ),
    ],
  },
  {
    id: "architecture-atelier",
    name: "Architecture Atelier",
    domain: "Architectural concept",
    description:
      "An architectural concept narrative with architectural photography, material studies and performance priorities.",
    palette: ["#F0EDE6", "#302D28", "#A56E4D", "#7B8E88"],
    font: "Georgia",
    slides: [
      templateCover(
        "A place that brings the day into balance.",
        "An illustrative spatial concept for a small community work and gathering space.",
        "Concept study / Atelier North",
      ),
      templateContent(
        "matrix",
        "Let the constraints sharpen the proposition.",
        "Schematic example only; all dimensions, conditions and approvals need project-specific verification.",
        [
          templateItem("Site", "A compact, adaptable urban footprint."),
          templateItem("People", "Individual work and shared activity."),
          templateItem("Light", "Bring daylight deeper into the plan."),
          templateItem("Change", "Allow different uses across the day."),
        ],
      ),
      templateContent(
        "split",
        "A simple spatial idea with a generous center.",
        "Arrange focused rooms around a shared, daylit gathering space.",
        [
          templateItem("The edge", "Quiet work and supporting functions."),
          templateItem("The center", "A flexible place to meet and exchange."),
        ],
      ),
      templateContent(
        "portfolio",
        "A calm, tactile material palette.",
        "Warm stone, natural wood and soft textiles bring the concept into focus.",
        [
          templateItem("Warm surfaces", "Tactile, repairable finishes."),
          templateItem(
            "Light structure",
            "A readable framework and open edges.",
          ),
          templateItem(
            "Soft thresholds",
            "Transitions that support different uses.",
          ),
        ],
      ),
      templateChart(
        "bar",
        "Compare performance priorities on one basis.",
        "Illustrative area distribution (%), not a measured plan. Schematic drawings are not to scale.",
        ["Shared space", "Focused rooms", "Support"],
        [{ name: "Area allocation (sample %)", values: [45, 35, 20] }],
      ),
      templateContent(
        "cta",
        "Move from a proposition to a tested brief.",
        "The next stage should challenge the concept against the real site and users.",
        [
          templateItem("Validate", "Confirm constraints and user priorities."),
          templateItem("Develop", "Test plan, section and material choices."),
          templateItem("Review", "Agree the next design-stage decision."),
        ],
      ),
    ],
  },
];
