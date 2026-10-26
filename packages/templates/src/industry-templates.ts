import type { TemplateRecipe } from "./template-types";
import {
  templateItem,
  templateCover,
  templateChart,
  templateContent,
} from "./template-content";

/** Original industry and creative deck narratives, with editable figures and complete offline artwork. */
export const industryTemplates: readonly TemplateRecipe[] = [
  {
    id: "property-portfolio",
    name: "Property Portfolio",
    domain: "Real estate opportunity",
    description:
      "A composed asset brief with editorial photography, facts, operating comparisons and diligence needs.",
    palette: ["#F8F3EA", "#223E3B", "#A77E49", "#6D9491"],
    font: "Georgia",
    slides: [
      templateCover(
        "A flexible asset with a clearer next chapter.",
        "Illustrative property opportunity · illustrative imagery, sample operating data and a diligence-first approach.",
        "Asset brief / Example House",
      ),
      templateContent(
        "split",
        "A location story built around everyday use.",
        "The sample concept supports mixed work, local services and flexible gathering.",
        [
          templateItem(
            "Context",
            "Generic urban setting; verify actual access.",
          ),
          templateItem(
            "Opportunity",
            "Adapt the space to a defined user need.",
          ),
        ],
      ),
      templateContent(
        "metrics",
        "Start with a concise, verifiable fact sheet.",
        "Fictional example values, not facts about a real property.",
        [
          templateItem("Floor area / m²", "Illustrative usable area.", "2,400"),
          templateItem("Flexible floors", "Sample configuration.", "4"),
          templateItem("Occupancy", "Illustrative current occupancy.", "76%"),
        ],
      ),
      templateChart(
        "column",
        "Separate operating history from assumptions.",
        "Illustrative occupancy (%). The target is an assumption, not a forecast or return guarantee.",
        ["Prior year", "Current year", "Target"],
        [{ name: "Occupancy (sample %)", values: [69, 76, 85] }],
      ),
      templateContent(
        "timeline",
        "A measured improvement sequence.",
        "Every intervention should follow appropriate technical and commercial diligence.",
        [
          templateItem(
            "Understand",
            "Verify condition, lease terms and user demand.",
          ),
          templateItem("Improve", "Test a bounded, costed adaptation."),
          templateItem("Review", "Compare outcomes with the agreed case."),
        ],
      ),
      templateContent(
        "cta",
        "Make diligence the next decision.",
        "This sample is not a valuation or investment recommendation.",
        [
          templateItem(
            "Technical",
            "Confirm condition and regulatory requirements.",
          ),
          templateItem("Commercial", "Verify leases, costs and assumptions."),
          templateItem("Decision", "Agree a scope for the next assessment."),
        ],
      ),
    ],
  },
  {
    id: "hospitality-journey",
    name: "Hospitality Journey",
    domain: "Guest experience",
    description:
      "A warm destination story with a guest journey, signature moments and transparent package options.",
    palette: ["#FBF3E6", "#263D3E", "#BF8258", "#5F9C9B"],
    font: "Georgia",
    slides: [
      templateCover(
        "A little slower. A little closer.",
        "An illustrative guest experience concept built around unhurried days and thoughtful local connection.",
        "Guest story / Tides House",
      ),
      templateContent(
        "quote",
        "Design for the way the guest wants to feel.",
        "“I want a break that feels considered, without a schedule that feels like work.”",
        [
          templateItem(
            "Illustrative guest profile",
            "A fictional composite, not a customer endorsement.",
          ),
        ],
      ),
      templateContent(
        "process",
        "A journey that stays simple from the start.",
        "A sample itinerary; adapt to real services, access needs and operating hours.",
        [
          templateItem("Arrive", "A warm welcome and a clear first choice."),
          templateItem(
            "Explore",
            "A few thoughtful ways to discover the place.",
          ),
          templateItem("Return", "An easy transition from the stay to home."),
        ],
      ),
      templateContent(
        "portfolio",
        "Three moments make the experience memorable.",
        "Thoughtful details shape the rhythm of an unhurried stay.",
        [
          templateItem("Quiet mornings", "Space for an unhurried start."),
          templateItem(
            "Local connection",
            "A considered introduction to nearby makers.",
          ),
          templateItem(
            "Shared evenings",
            "A simple, welcoming place to gather.",
          ),
        ],
      ),
      templateContent(
        "compare",
        "Offer choice without creating friction.",
        "Illustrative packages; replace prices, taxes, availability and exclusions before use.",
        [
          templateItem("Rest", "Stay and a simple breakfast."),
          templateItem(
            "Discover",
            "Stay, breakfast and one guided experience.",
          ),
          templateItem(
            "Gather",
            "A flexible small-group stay and shared activity.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Make the next step feel welcoming.",
        "Replace this sample with verified booking or partnership information.",
        [
          templateItem("Choose", "State the stay or experience clearly."),
          templateItem("Ask", "Offer an accessible route for questions."),
          templateItem(
            "Confirm",
            "Explain inclusions, terms and the next step.",
          ),
        ],
      ),
    ],
  },
  {
    id: "culinary-story",
    name: "Culinary Story",
    domain: "Food and restaurant concept",
    description:
      "An editorial food concept with an occasion, signature offer, sourcing philosophy and tasting invitation.",
    palette: ["#FFF3DC", "#472F25", "#C76538", "#6A8353"],
    font: "Georgia",
    slides: [
      templateCover(
        "Seasonal food. A generous table.",
        "An illustrative neighborhood food concept shaped by simple ingredients and a sense of occasion.",
        "Concept menu / Table & Field",
      ),
      templateContent(
        "statement",
        "The occasion matters as much as the menu.",
        "A place for people who want good food, thoughtful service and an easy reason to gather.",
      ),
      templateContent(
        "portfolio",
        "From the garden to the table.",
        "Seasonal ingredients, careful preparation and a generous finish.",
        [
          templateItem(
            "From the garden",
            "A changing seasonal vegetable plate.",
          ),
          templateItem("From the hearth", "A warm shared centerpiece."),
          templateItem("For the table", "A simple finish, made to share."),
        ],
      ),
      templateContent(
        "process",
        "Craft is visible in the choices.",
        "Tell the sourcing story with specific, supportable claims.",
        [
          templateItem(
            "Source carefully",
            "Name verified ingredients and suppliers.",
          ),
          templateItem(
            "Prepare simply",
            "Let the central ingredient stay recognizable.",
          ),
          templateItem(
            "Serve generously",
            "Make the experience easy to understand.",
          ),
        ],
      ),
      templateChart(
        "column",
        "Build the business around the occasion.",
        "Illustrative sales mix (%), not actual restaurant performance. Prices and margins need a separate cost model.",
        ["Lunch", "Evening", "Shared events"],
        [{ name: "Sales mix (sample %)", values: [30, 50, 20] }],
      ),
      templateContent(
        "cta",
        "Begin with a conversation around the table.",
        "Use a real, verified route for tasting requests or collaboration.",
        [
          templateItem("Taste", "A focused introduction to the menu."),
          templateItem("Discuss", "Occasion, access needs and service format."),
          templateItem("Plan", "Confirm scope, pricing and the next date."),
        ],
      ),
    ],
  },
  {
    id: "retail-season",
    name: "Retail Season",
    domain: "Seasonal merchandising",
    description:
      "A confident seasonal retail plan linking customer signals, assortment, activation and readiness.",
    palette: ["#F9F1F0", "#382C38", "#B74A6B", "#B19864"],
    font: "Arial",
    slides: [
      templateCover(
        "A season of fewer, better choices.",
        "An illustrative collection and channel plan for a focused seasonal retail story.",
        "Season plan / Edit 27",
      ),
      templateContent(
        "cards",
        "Three customer signals shape the edit.",
        "Example observations; replace with current research and trading evidence.",
        [
          templateItem(
            "Versatility",
            "Products need to work across more occasions.",
          ),
          templateItem("Confidence", "Customers want clear reasons to choose."),
          templateItem("Value", "Durability matters alongside the price."),
        ],
      ),
      templateContent(
        "portfolio",
        "Give the assortment a clear rhythm.",
        "A considered edit of texture, color and everyday essentials.",
        [
          templateItem(
            "The everyday core",
            "Reliable pieces with broad usefulness.",
          ),
          templateItem(
            "The seasonal accent",
            "A focused expression of the collection.",
          ),
          templateItem(
            "The considered gift",
            "A simple choice for a shared occasion.",
          ),
        ],
      ),
      templateContent(
        "timeline",
        "One story, coordinated across the channels.",
        "The same customer promise should connect discovery, purchase and follow-up.",
        [
          templateItem("Introduce", "Editorial story and early access."),
          templateItem("Activate", "Clear merchandising and a useful offer."),
          templateItem("Sustain", "Real product use and customer support."),
        ],
      ),
      templateChart(
        "bar",
        "Balance ambition with inventory discipline.",
        "Illustrative unit targets by assortment group. Units are not revenue or margin.",
        ["Everyday core", "Seasonal accent", "Gift edit"],
        [
          { name: "Prior season (sample units)", values: [800, 450, 250] },
          { name: "Target (sample units)", values: [900, 500, 300] },
        ],
      ),
      templateContent(
        "cta",
        "Make readiness a shared decision.",
        "A season is ready when the customer promise and the operation agree.",
        [
          templateItem(
            "Product",
            "Confirm availability and product information.",
          ),
          templateItem("Channels", "Check creative, pricing and destinations."),
          templateItem(
            "Operations",
            "Agree stock, service and review thresholds.",
          ),
        ],
      ),
    ],
  },
  {
    id: "supply-chain",
    name: "Supply Chain",
    domain: "Operations resilience",
    description:
      "An orderly operating brief with a network, service baseline, risks and an improvement sequence.",
    palette: ["#F3F5F5", "#253C47", "#287E89", "#D69A36"],
    font: "Arial",
    slides: [
      templateCover(
        "A more resilient route from source to service.",
        "An illustrative operating plan focused on reliable flow, visible exceptions and clear ownership.",
        "Operations review / Flowline",
      ),
      templateContent(
        "process",
        "Make the network understandable.",
        "Use real stage names and handoffs; a decorative world map is not needed.",
        [
          templateItem("Source", "Agree inputs and supplier commitments."),
          templateItem("Prepare", "Plan capacity and readiness."),
          templateItem("Deliver", "Coordinate dispatch and service."),
          templateItem("Learn", "Review exceptions and improve the flow."),
        ],
      ),
      templateChart(
        "line",
        "Averages show direction, not every experience.",
        "Illustrative mean lead time in days. Add percentile measures when tail delays affect the decision.",
        ["Jan", "Feb", "Mar", "Apr", "May"],
        [
          {
            name: "Mean lead time (sample days)",
            values: [14, 13, 12, 11, 10],
          },
        ],
      ),
      templateContent(
        "matrix",
        "Name the bottleneck and the response.",
        "Status words keep the risk discussion understandable without relying on color.",
        [
          templateItem(
            "Supplier / watch",
            "Verify critical input availability.",
          ),
          templateItem(
            "Capacity / act",
            "Protect the constrained work center.",
          ),
          templateItem(
            "Transport / watch",
            "Prepare an alternative dispatch route.",
          ),
          templateItem(
            "Visibility / act",
            "Give exceptions an owner and review time.",
          ),
        ],
      ),
      templateContent(
        "timeline",
        "Improve the flow in a useful sequence.",
        "Avoid optimizing a local step while the system remains constrained.",
        [
          templateItem("Stabilize", "Reduce the most disruptive exceptions."),
          templateItem("Connect", "Share the information needed at handoff."),
          templateItem(
            "Optimize",
            "Test improvements against service and cost.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Review the decision at the operating cadence.",
        "Make the next improvement visible to the people who can deliver it.",
        [
          templateItem("Owner", "Assign the constrained stage."),
          templateItem(
            "Measure",
            "Track service, lead time and cost together.",
          ),
          templateItem(
            "Cadence",
            "Review exceptions weekly and decisions monthly.",
          ),
        ],
      ),
    ],
  },
  {
    id: "finance-outlook",
    name: "Finance Outlook",
    domain: "Financial forecast",
    description:
      "A restrained financial narrative separating history, forecast assumptions, scenarios and decisions.",
    palette: ["#F8F8F4", "#223148", "#456F9B", "#A2854B"],
    font: "Arial",
    slides: [
      templateCover(
        "A disciplined outlook for the next quarter.",
        "Illustrative financial review · actuals, assumptions and a decision-ready range of scenarios.",
        "Finance / Example Company",
      ),
      templateChart(
        "line",
        "Keep the historical baseline visible.",
        "Illustrative historical revenue, USD millions. The series contains sample actual periods only.",
        ["Q1", "Q2", "Q3", "Q4"],
        [
          {
            name: "Historical revenue (sample $M)",
            values: [3.2, 3.5, 3.7, 4.1],
          },
        ],
      ),
      templateContent(
        "cards",
        "Three assumptions drive the outlook.",
        "A forecast is only useful when its sensitive assumptions are explicit.",
        [
          templateItem("Demand", "Expected customer volume and timing."),
          templateItem(
            "Retention",
            "The share of recurring business retained.",
          ),
          templateItem(
            "Cost base",
            "Capacity, input prices and committed spend.",
          ),
        ],
      ),
      templateChart(
        "column",
        "Use scenarios to make uncertainty actionable.",
        "Illustrative next-quarter revenue, USD millions. All three values are modeled assumptions, not actuals.",
        ["Downside", "Base", "Upside"],
        [{ name: "Forecast revenue (sample $M)", values: [3.8, 4.4, 4.9] }],
      ),
      templateContent(
        "compare",
        "Protect optionality in the use of cash.",
        "Example priorities, not investment advice or a financing recommendation.",
        [
          templateItem(
            "Preserve",
            "Protect essential commitments and liquidity.",
          ),
          templateItem(
            "Invest selectively",
            "Fund the clearest near-term operating return.",
          ),
          templateItem(
            "Expand later",
            "Stage discretionary spend behind evidence.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Agree the assumptions before the number.",
        "The next decision should connect the scenario, the spend and the review trigger.",
        [
          templateItem(
            "Confirm",
            "Validate the demand and retention assumptions.",
          ),
          templateItem("Authorize", "Set a bounded operating investment."),
          templateItem("Revisit", "Name the threshold that changes the plan."),
        ],
      ),
    ],
  },
  {
    id: "security-brief",
    name: "Security Brief",
    domain: "Security risk update",
    description:
      "A clear risk brief with a threat model, control coverage, remediation owners and a bounded decision.",
    palette: ["#111C2A", "#F1F5FA", "#4BC3CE", "#E3AC53"],
    font: "Arial",
    slides: [
      templateCover(
        "A clearer posture. A focused response.",
        "Illustrative security update · reduce the most meaningful exposure without losing sight of uncertainty.",
        "Security brief / Example systems",
      ),
      templateContent(
        "matrix",
        "Frame the threat model before the score.",
        "Example categories; no real incident or threat attribution is implied.",
        [
          templateItem("Assets", "Customer data and essential operations."),
          templateItem(
            "Entry points",
            "Identity, integrations and public services.",
          ),
          templateItem(
            "Likely failure",
            "Excess privilege or an unreviewed change.",
          ),
          templateItem("Boundary", "One defined system and review period."),
        ],
      ),
      templateChart(
        "bar",
        "Coverage needs a definition, not only a percentage.",
        "Illustrative control coverage (%). Replace with verified scope and evidence; coverage is not effectiveness.",
        ["Identity", "Logging", "Recovery", "Change review"],
        [{ name: "Coverage (sample %)", values: [88, 76, 72, 82] }],
      ),
      templateContent(
        "cards",
        "Separate severity, confidence and action.",
        "A useful risk discussion makes uncertainty visible.",
        [
          templateItem(
            "Severity / high",
            "A failure could affect a critical workflow.",
          ),
          templateItem(
            "Confidence / medium",
            "Evidence is directional and needs validation.",
          ),
          templateItem(
            "Response / staged",
            "Address the strongest supported exposure first.",
          ),
        ],
      ),
      templateContent(
        "agenda",
        "Remediation with an owner and a review point.",
        "Sample roles and dates; replace with accountable teams and agreed due dates.",
        [
          templateItem(
            "Least privilege",
            "Identity owner · validate access paths.",
            "Week 1",
          ),
          templateItem(
            "Detection",
            "Platform owner · verify useful alerts.",
            "Week 2",
          ),
          templateItem(
            "Recovery",
            "Service owner · exercise a bounded restore.",
            "Week 3",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Authorize the focused remediation window.",
        "Keep the decision tied to a defined system, risk and success condition.",
        [
          templateItem("Scope", "Confirm the affected assets and controls."),
          templateItem("Capacity", "Reserve the responsible teams’ time."),
          templateItem("Evidence", "Review completion and residual exposure."),
        ],
      ),
    ],
  },
  {
    id: "developer-keynote",
    name: "Developer Keynote",
    domain: "Technical product talk",
    description:
      "A developer story with editable code, architectural boundaries and an honest performance example.",
    palette: ["#151626", "#F3F3FF", "#A899FF", "#6BD6BB"],
    font: "Arial",
    slides: [
      templateCover(
        "From an idea to a portable presentation.",
        "An illustrative developer talk about clear contracts, editable data and output that travels.",
        "Developer keynote / Lipat",
      ),
      templateContent(
        "statement",
        "Authoring and file formats should not share a burden.",
        "Describe the slide once. Keep editing, layout, rendering and export behind clear boundaries.",
      ),
      templateContent(
        "code",
        "The smallest useful authoring loop.",
        "const deck = createDeck(input, { engine });\nif (deck.ok) {\n  const result = deck.value.compile();\n  if (result.ok) {\n    const scene = result.value.scene;\n    const pptx = engine.writePptx(scene);\n  }\n}",
        [
          templateItem("Input", "Ordinary serializable slide data."),
          templateItem("Output", "One scene for preview and export."),
        ],
      ),
      templateContent(
        "process",
        "Give each boundary one clear job.",
        "The source document and resolved scene serve different purposes.",
        [
          templateItem("Author", "Apply atomic document edits."),
          templateItem("Compile", "Resolve layout and diagnostics."),
          templateItem("Render", "Display an immutable scene."),
          templateItem("Export", "Translate the scene to a file format."),
        ],
      ),
      templateChart(
        "bar",
        "Measure in the environment that matters.",
        "Illustrative task times in milliseconds, not Lipat benchmarks. Replace with a reproducible method.",
        ["Parse", "Compile", "Export"],
        [{ name: "Task time (sample ms)", values: [24, 12, 38] }],
      ),
      templateContent(
        "cta",
        "Build a small complete example.",
        "Import createDeck from @byfungsi/lipat, initialize the engine, then keep the document editable.",
        [
          templateItem(
            "Start",
            "Choose a template or a small source document.",
          ),
          templateItem("Inspect", "Read diagnostics before exporting."),
          templateItem("Extend", "Add host persistence and resource policy."),
        ],
      ),
    ],
  },
  {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    domain: "Design portfolio",
    description:
      "An editorial portfolio with a point of view, case study, exploration, system and invitation.",
    palette: ["#F7EEE7", "#2D2630", "#D45D4A", "#7A62A8"],
    font: "Georgia",
    slides: [
      templateCover(
        "Thoughtful work. A distinct point of view.",
        "An illustrative independent studio portfolio exploring clarity, character and useful systems.",
        "Selected work / Studio Common",
      ),
      templateContent(
        "split",
        "A clearer identity for a shared place.",
        "Fictional case study: a neighborhood cultural space needed a system people could recognize and use.",
        [
          templateItem(
            "The challenge",
            "Connect a varied program with one clear voice.",
          ),
          templateItem(
            "The role",
            "Strategy, identity and a practical design system.",
          ),
        ],
      ),
      templateContent(
        "portfolio",
        "Explore the idea before polishing the surface.",
        "Original abstract studies, created for this template; not commissioned client work.",
        [
          templateItem(
            "Open forms",
            "A visual language with room for participation.",
          ),
          templateItem(
            "Warm contrast",
            "A palette that balances energy and calm.",
          ),
          templateItem(
            "Clear rhythm",
            "A hierarchy that makes the next step visible.",
          ),
        ],
      ),
      templateContent(
        "matrix",
        "A system earns its place through use.",
        "Keep the core decisions editable and easy to apply.",
        [
          templateItem(
            "Type",
            "Editorial statements and clear supporting text.",
          ),
          templateItem("Color", "A warm base with purposeful accents."),
          templateItem(
            "Composition",
            "Generous margins and a stable caption grid.",
          ),
          templateItem("Voice", "Direct, welcoming and concrete."),
        ],
      ),
      templateContent(
        "quote",
        "The outcome is a more useful conversation.",
        "A strong identity makes it easier for people to understand what a place offers and how to take part.",
        [
          templateItem(
            "Illustrative project reflection",
            "A design proposition, not a real client result or testimonial.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Let’s make something considered.",
        "Replace this sample invitation with your real practice, contact details and availability.",
        [
          templateItem("Bring", "A problem worth understanding."),
          templateItem("Explore", "A focused first conversation."),
          templateItem(
            "Create",
            "A useful direction and a practical next step.",
          ),
        ],
      ),
    ],
  },
  {
    id: "event-program",
    name: "Event Program",
    domain: "Conference and community event",
    description:
      "An energetic event deck with an audience promise, program, timed agenda and access information.",
    palette: ["#FFF5E8", "#2D2350", "#7A4CCB", "#E99B37"],
    font: "Arial",
    slides: [
      templateCover(
        "A day for ideas that move us forward.",
        "An illustrative community gathering for people building thoughtful products and useful systems.",
        "Event program / Open Assembly",
      ),
      templateContent(
        "cards",
        "A room for different kinds of builders.",
        "The program brings complementary perspectives to a shared question.",
        [
          templateItem(
            "Designers",
            "People shaping how ideas become experiences.",
          ),
          templateItem(
            "Engineers",
            "People turning clear concepts into working systems.",
          ),
          templateItem(
            "Leaders",
            "People helping teams make better decisions.",
          ),
        ],
      ),
      templateContent(
        "portfolio",
        "Three ways to take part.",
        "Role labels are examples; no speaker endorsement is implied.",
        [
          templateItem("Listen", "Short talks with a clear point of view."),
          templateItem("Make", "A practical session with something to try."),
          templateItem(
            "Connect",
            "Time to compare notes and meet collaborators.",
          ),
        ],
      ),
      templateContent(
        "agenda",
        "A simple program, with room between sessions.",
        "Illustrative schedule · all times Asia/Jakarta (UTC+7). Replace with confirmed event details.",
        [
          templateItem(
            "Doors and welcome",
            "Arrive, settle in and meet the room.",
            "09:00",
          ),
          templateItem(
            "Ideas and practice",
            "Talks, a break and a guided workshop.",
            "10:00",
          ),
          templateItem(
            "Conversation and close",
            "Share what changed and what comes next.",
            "15:00",
          ),
        ],
      ),
      templateContent(
        "matrix",
        "Make access part of the program.",
        "Verify the venue and contact route before sharing.",
        [
          templateItem(
            "Getting there",
            "Provide verified transport and entry guidance.",
          ),
          templateItem(
            "Access needs",
            "Offer a clear route for accommodation requests.",
          ),
          templateItem(
            "Participation",
            "Explain session formats and what to bring.",
          ),
          templateItem(
            "Code of conduct",
            "Name the support and reporting contact.",
          ),
        ],
      ),
      templateContent(
        "cta",
        "Join the conversation.",
        "Replace this sample with a verified registration destination and capacity information.",
        [
          templateItem(
            "Register",
            "Explain the ticket or participation process.",
          ),
          templateItem(
            "Prepare",
            "Share the confirmed agenda and access details.",
          ),
          templateItem(
            "Connect",
            "Invite one useful question to bring to the room.",
          ),
        ],
      ),
    ],
  },
];
