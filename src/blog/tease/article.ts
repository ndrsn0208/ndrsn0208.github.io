import type { Essay } from '../essay/types'

/* The page's words. The page and the static build both read this file, so it
   holds text only. Every number quoted here is in the paper's text or tables,
   and the figures read theirs from evidence.ts. Terms follow the paper's term
   sheet, one term per concept. BLOG.md lists them. The page opens with the
   main results, and each level is followed by its results. */

const models = ['GPT-6.2 Astra', 'Claude Fable 5.2', 'GPT-6.2 Sol', 'Claude Opus 5.5'] as const

export const teaseEssay = {
  id: 'tease',
  path: '/blog/tease/',
  name: 'TEASE',
  headline: 'A benchmark for test-time systematic generalization in embodied agents',
  description: 'TEASE (Test-Time Embodied Agent Systematicity Evaluation) tests whether an embodied agent uses a physical attribute where it is and only where it is, chains attributes over the steps of one table, and solves tables within fewer moves after it has played shorter ones. With the results of four frontier models.',
  date: '2026-11-20',
  authors: [{ name: 'Zekun Wang' }],
  affiliation: 'Georgia Institute of Technology',
  links: [],
  image: '/blog-assets/tease/share/essay.png',
  imageAlt: 'TEASE. A benchmark for test-time systematic generalization in embodied agents. A table of everyday objects seen from above, each under a letter, with the first move of a plan of five moves.',

  summary: [
    'People use an object for what its physical attributes allow, whether or not it is the typical tool for the job. A shard of glass cuts, and a bent wire hooks. The same knowledge tells them where a use will fail, and they chain such uses so that one step makes the tool of the next. We study whether embodied agents built on vision-language models do the same at test time.',
    'TEASE (Test-Time Embodied Agent Systematicity Evaluation) is a benchmark built from eight atoms, each a visible attribute with the function it enables. Each task is a table of everyday objects with a goal, which the agent sees only in pictures. The atom level tests systematicity with pairs of one-move tables that differ in one object. The composite level tests compositional generalization with tables of two to eight steps. The third level measures test-time continual learning: tables played after shorter ones, with the agent’s own notes, are compared with the same tables played alone.',
    'We evaluate four frontier models. **Every model uses an attribute on objects that are not typical tools, and every model also acts where the attribute is absent**: pairs with both tables right lie between 38.5% and 70.9%. The models solve **9.1% to 34.3%** of the composite tables in as few moves as the oracle, and 25.8% to 75.2% with twice as many moves. With their own notes from shorter tables they solve more tables at the same budget of moves, clearly for three of the four models when the budget is twice the number of steps.',
  ],
  lead: 'results',

  sections: [
    {
      id: 'table',
      label: 'A table',
      heading: 'A task is a table of everyday objects with a goal',
      blocks: [
        { p: 'A table holds everyday objects, each under a letter, and a goal such as “get L down from N.” The agent reaches the goal by using one object on another, one move at a time. On the table below five moves reach the goal, and each move but the last frees or makes what a later move needs.' },
        { exhibit: 'table' },
      ],
    },
    {
      id: 'atoms',
      label: 'Atoms',
      heading: 'An atom is a visible attribute with the function it enables',
      blocks: [
        { p: 'TEASE has eight atoms. A sharp edge cuts, a hooked end hooks, a long rigid shaft pokes, a hot or burning object heats, a heavy and hard object pounds, a hollow and watertight object contains water, a long and flexible object ties, and a thin, flat, rigid tip pries. We chose attributes that show in a picture and that many kinds of object have.' },
        { p: 'For each function we fix its typical tools, the objects that are made for the function or that people name first for it, such as a knife for cutting and a hammer for pounding. An object that has the attribute and is no typical tool is a non-typical object. A shard of a broken mirror cuts, a hex key hooks, and a rain boot holds water. **The steps of TEASE are built on non-typical objects.**' },
        { exhibit: 'atoms' },
        { p: 'An attribute comes in degrees, and a function works only when the degree fits the target. A shard of glass cuts canvas and does not cut wood, a hook must be narrower than the tube it goes into, and a stick must be longer than the tube it is pushed through. One record, the object table, decides what every move does. It is written by hand from the sizes, weights and materials of its 484 objects, and it gives every attribute an object has, with its degree. An object therefore does whatever it can and is not limited to the use a table was built for.' },
      ],
    },
    {
      id: 'setup',
      label: 'Setup',
      heading: 'The agent sees a table only in pictures and answers one move per turn',
      blocks: [
        { p: 'The agent sees four views of the table and a close-up of every object, each object under a letter. The text gives the goal in one sentence that names objects by their letters, for example “get L down from N.” It also lists by letter the objects the hand can pick up, the objects fixed in place, and the objects that can be seen out of the hand’s reach, each with the closed place that holds it. A closed place is a container, a tube, a shelf or a cabinet that the hand cannot open or reach into. **No text says what an object is or what it can do.**' },
        { p: 'The agent answers with one move per turn. The move use(X, Y) uses object X on object Y and names no function. The move tie(C, X, Y) ties X and Y together with the cord C. The move none() says that the goal cannot be reached with what is on the table. Every move is carried out by a robot hand in the MuJoCo simulator. After each move the agent is told whether something changed and gets the updated lists and new pictures.' },
        { exhibit: 'turn' },
        { p: 'A table ends when the goal is reached, when the agent answers none(), when a move puts the goal out of reach, or at a limit of moves that lies above every budget we report. The agent is told neither this limit nor the number of steps a table needs, and no level shows a demonstration.' },
        { p: 'The agents we evaluate are four vision-language models: GPT-6.2 Astra and GPT-6.2 Sol with reasoning effort max, and Claude Fable 5.2 and Claude Opus 5.5 with reasoning effort xhigh. Each model plays every table once per run.' },
      ],
    },
    {
      id: 'pairs-of-tables',
      label: 'Pairs of tables',
      heading: 'The atom level pairs a positive table with a negative table',
      blocks: [
        { p: 'The atom level asks whether a model uses an attribute where it is and only where it is. Every table of this level needs one move, and the tables come in pairs. On the positive table exactly one object can do the step. This working object is a non-typical object, such as a sharp stone flake for cutting a sewn sack open. Every other object on the table is a near-miss object, which comes close to the attribute and lacks it: a typical tool without the attribute, an object in a state without it, an object that falls short by a degree one can see, or an object that has only a part of the attribute.' },
        { p: 'The negative table is the same table with the working object replaced by its counterpart, a similar-looking object without the attribute. Nothing on the negative table reaches the goal, and the right answer is none().' },
        { exhibit: 'pair' },
        { p: 'We count a positive table as right when the first move reaches the goal, a negative table as right when the first move is none(), and **a pair as right when both tables are**. The level has 192 pairs, and negative tables and pairs are scored on 182 of them.' },
      ],
    },
    {
      id: 'atom-level',
      label: 'Atom level',
      heading: 'Models use an attribute where it is, and also act where it is absent',
      blocks: [
        { p: 'On the positive tables, where a non-typical object is the only working object, the first move of every model reaches the goal on 87.5% to 96.4% of the tables. On the negative tables, where the right answer is none(), the first move is none() on 42.3% to 75.3% of the tables. **Pairs with both tables right therefore fall to between 38.5% for GPT-6.2 Sol and 70.9% for GPT-6.2 Astra**, against 0% for an agent that always acts and 0% for one that always answers none().' },
        { exhibit: 'pairs' },
        { p: 'On a negative table that a model gets wrong, it rarely mistakes the counterpart for the working object. Instead, the model first tries a near-miss object, most often one that falls short by a degree or a typical tool without the attribute. Every negative table that a model gets wrong still ends with none(), after 2.4 to 5.9 moves on average.' },
        { exhibit: 'moves' },
        { p: 'The negative tables are much harder for some functions than for others. **Every model is right on at least 25 of the 28 negative tables of contain and on at most 6 of the 18 of hook.**' },
        { exhibit: 'functions' },
      ],
    },
    {
      id: 'plans-and-budgets',
      label: 'Plans and budgets',
      heading: 'A composite table needs k steps, and one play is scored at every budget',
      blocks: [
        { p: 'The composite level asks whether a model chains the atoms when a goal needs several steps. A composite table needs k steps of k different functions, with 30 tables for each k from 2 to 8. A step frees an object from a closed place, makes a tool that is not on the table, or acts on the goal object. A tool is made by changing one object or by tying two. The object that a step frees or makes is the tool or the target of a later step. The table shown above, with the goal “get L down from N,” needs five steps.' },
        { p: 'Each table is built with a plan, the moves of a shortest way to its goal, and no way to the goal has fewer than k moves. A move that does one of the plan’s steps is a plan step. An oracle that follows the plan solves every table in exactly k moves, and no agent reaches the goal in fewer. We play every table once and score the play at every budget. **A table is solved within a budget if the goal is reached in at most that many moves.** We report the budgets from k moves, where every move must be a plan step, to twice k moves.' },
        { exhibit: 'play' },
        { p: 'The 210 composite tables have 1,050 steps. Of these, 808 free an object, 137 make a tool, and 105 act on the goal object. A composite table shows 22.3 lettered objects on average, and at a state an agent can write about 2,300 different moves. On average 55.3 of them change something, 2.7 are plan steps, and 2.8 put the goal out of reach.' },
      ],
    },
    {
      id: 'composite-level',
      label: 'Composite level',
      heading: 'The share solved within k moves falls fast with the number of steps',
      blocks: [
        { p: 'Within k moves, where every move must be a plan step, the models solve 9.1% to 34.3% of the composite tables, against 100% for the oracle. With twice k moves they solve 25.8% to 75.2%. **GPT-6.2 Astra is the best model at every budget from k to twice k**, and no model solves any table in fewer than k moves.' },
        { p: 'Three reference agents frame the composite level. The oracle follows the plan and solves every composite table in exactly k moves. A scripted agent that knows the plan knows its targets and its functions in order and does not know which object does a step. At each step it tries the objects that have the step’s attribute, in a random order. A second scripted agent picks at random among the moves that change something.' },
        { exhibit: 'budget' },
        { p: 'The scripted agent that knows the plan is above every model at every budget from k to twice k. It picks its objects at random, while the first move of the models finds the working object on 87.5% to 96.4% of the positive atom tables. We interpret its lead as the value of knowing which step comes next.' },
        { p: 'The share solved within k moves falls from between 43.3% and 66.7% at two steps to between 0% and 3.3% at eight steps. A model that treated a table of k steps as k one-move tables, each right as often as its positive atom tables, would see this share fall far less. For GPT-6.2 Astra, whose first move is right on 91.1% of the positive atom tables, this gives 83.1% at two steps and 47.6% at eight, against the 66.7% and 3.3% that it reaches. **A composite table thus asks for more than its steps do as separate one-move tables.**' },
        { exhibit: 'steps' },
      ],
    },
    {
      id: 'stages-and-notes',
      label: 'Stages and notes',
      heading: 'Test-time continual learning is measured in stages, against the same tables played alone',
      blocks: [
        { p: 'The third level measures test-time continual learning: whether a model solves tables within fewer moves after it has played shorter ones. The tables are played in a sequence of eight stages. Stage 1 holds five atom tables of one function. Stage i, for i from 2 to 8, holds up to five composite tables of i steps. Their functions are the function of stage 1 and the one function that each later stage adds. There are eight sequences, and each function comes first in one sequence. Their 315 tables are 40 atom tables and 275 composite tables. The composite tables are 211 different tables, of which 45 are also tables of the composite level.' },
        { p: 'After every stage the agent is shown the tables it has just played and is asked to write the notes it wants to keep for later tables. These notes replace its earlier notes and are all that it has from before when the next stage starts. **The control for a table of a sequence is the same table played alone, with no notes.** We run every sequence three times, with a budget of k, 10 or twice k moves as the limit of each table, and compare each run with the same tables alone scored at that budget.' },
        { exhibit: 'stages' },
      ],
    },
    {
      id: 'continual-learning',
      label: 'Test-time continual learning',
      heading: 'Every model solves more tables with its notes than alone',
      blocks: [
        { p: 'Test-time continual learning compares two plays of each composite table at the same budget. One is at its stage, where the agent holds the notes it wrote after the earlier stages. The other is the same table alone, with no notes. **Within k moves, GPT-6.2 Astra solves 53.8% of the 275 tables with notes and 46.9% of the same tables alone.** The opening figure shows the first of these shares at every stage, for the four models. The figure below sets the same tables alone beside it.' },
        { p: 'Every model solves more of these tables with notes than alone, at each of the three budgets. Within k moves the paired differences with their standard errors are 6.9 ± 2.7 points for GPT-6.2 Astra, 15.6 ± 2.9 for Claude Fable 5.2, 5.8 ± 2.9 for GPT-6.2 Sol and 3.6 ± 2.2 for Claude Opus 5.5. At the budget of twice k they are 9.5 ± 2.2 points for GPT-6.2 Astra (86.9% against 77.5%), 14.2 ± 3.1 for Claude Fable 5.2 and 20.1 ± 3.3 for Claude Opus 5.5. For GPT-6.2 Sol the shares with notes and alone are comparable at this budget (73.1% against 70.5%), with a difference of 2.5 ± 2.9 points.' },
        { exhibit: 'gain' },
        { p: 'At the budgets twice k and 10 moves, the gain is larger at stages 6 to 8, the long tables that come last, than at stages 2 to 5 for every model. At twice k the gain is 8.3 to 26.5 points at stages 6 to 8 and −1.9 to +15.1 points at stages 2 to 5.' },
      ],
    },
    {
      id: 'first-move',
      label: 'First move',
      heading: 'The first move is least often a plan step at the start of a table',
      blocks: [
        { p: 'We replay every recorded play of a composite table on the object table and sort each move by what it does. The first move at a state is a plan step less often the more steps are still to do. With one step to do, it is a plan step at 86.6% to 94.9% of the states, close to the 87.5% to 96.4% of the positive atom tables. **With eight steps to do, at the start of the longest tables, it is one at 10.0% to 50.0%.**' },
        { exhibit: 'first' },
        { p: 'A step is done at the first try when the first move at a state does it. When an earlier step has freed the tool, the step is done at the first try in 59.9% to 86.6% of the cases. The freed object then appears in the new pictures and in the list of objects the hand can pick up. When the tool has been on the table from the start, among some twenty other objects, the step is done at the first try in 24.2% to 60.9% of the cases. A model thus does the next step of the plan readily once an earlier step has freed its tool, and it finds a step whose tool lies among the other objects much less often. The first step of a table is always of this kind, and only the later steps of the plan show which object it needs.' },
      ],
    },
    {
      id: 'making',
      label: 'Making a tool',
      heading: 'Steps that make a tool are left open more often',
      blocks: [
        { p: 'A step is left open when the table ends with the step not done although its tool and its target are at hand. Most unsolved tables end with exactly one step left open. We count a step as reached when it is done or left open. **A step that makes a tool is left open in 11.8% to 54.1% of the cases in which the model reaches it, against 4.0% to 23.4% for a step that frees an object.**' },
        { exhibit: 'open' },
        { p: 'We read the reasoning summaries of 52 unsolved tables on which a step that makes a tool was left open. In 42 of them the model states the need that the tool would serve, for example that a lid has to be pried. It then looks for an object that can do the step as it is. In 36 tables it uses the object that the step would change as it is.' },
        { p: 'Many composite tables end with the model’s own none(), although a way to the goal always exists: 103 of 209 for Claude Opus 5.5, 41 of 210 for Claude Fable 5.2, 22 for GPT-6.2 Astra and 17 for GPT-6.2 Sol. The models thus err in both directions about what the objects on a table allow. On the negative atom tables they act although no object has the attribute, and on the composite tables they answer none() although an object that has it lies on the table or can be made.' },
      ],
    },
    {
      id: 'carry-over',
      label: 'What notes carry',
      heading: 'Notes carry over steps more than functions',
      blocks: [
        { p: 'We split the steps of the tables played with notes by what the earlier stages of the same sequence have shown. On a step that an earlier stage has shown, with the same function, tool and target, the share done at the first try rises by 18.4 to 31.8 points over the same step alone. It rises by 8.0 to 23.9 points with the same tool for the function at another target, by 5.1 to 14.3 points with a new tool for a function that an earlier stage has shown, and by −0.7 to +10.4 points with a function that is new at the stage.' },
        { exhibit: 'shown' },
        { p: 'The notes agree with this order. Of the statements in the notes that the models hold before stage 8, 45% to 53% record a specific object or place with what worked or failed on it, and 8% to 12% say what an attribute allows. One note of Claude Fable 5.2 reads “Pry tools that worked: key, coin, fork, file, spoon, screwdriver, flat tool, the thin tool floated out of a tube.” It does not say what these objects share. **What the models carry over between stages is more often what worked on a table they have seen than what an attribute allows.**' },
      ],
    },
  ],

  exhibits: {
    results: {
      title: 'Four frontier models on TEASE',
      description: 'The main results of four models on the three levels. Atom level: pairs with both tables right, 38.5% to 70.9%. Composite level: the 210 composite tables solved within a budget from k moves, the number of steps of a table, to twice k moves, 9.1% to 34.3% within k moves and 25.8% to 75.2% within twice k. Test-time continual learning: the composite tables of each stage solved within k moves with notes. Over stages 2 to 8 the models solve 15.0% to 53.8% of these tables with notes and 11.3% to 46.9% of the same tables alone.',
      wide: true,
      tabs: models,
      tabsLabel: 'The model whose numbers are shown',
      steps: [
        { label: 'Atom level', say: 'A pair is two one-move tables that differ in one object. On one table an object that is no typical tool can do the step. On the other nothing can, and the right answer is none(). Both tables are right in 38.5% to 70.9% of the pairs.' },
        { label: 'Composite level', say: 'A composite table needs k steps, and each step but the last frees or makes what a later step needs. The models solve 9.1% to 34.3% of the tables within k moves, as few as the oracle, and 25.8% to 75.2% within twice k moves.' },
        { label: 'Test-time continual learning', say: 'Composite tables are played in stages of two to eight steps, and the agent keeps its own notes between stages. Within k moves the models solve 15.0% to 53.8% of these tables with notes and 11.3% to 46.9% of the same tables alone.' },
      ],
      notes: [
        'The pairs are scored on 182 of the 192 pairs of the atom level.',
        'Each curve of the composite level is the cubic through the values at k and at twice k that is closest to the values at the budgets between, as in the paper’s figure. The points are the measured values.',
        'Stage i holds the composite tables of i steps, 36 to 40 tables. The two figures of test-time continual learning are over stages 2 to 8, 275 tables. Tables on which Claude Opus 5.5 gave no answer are left out of its counts.',
      ],
    },
    table: {
      title: 'A composite table of five steps, played along its plan',
      description: 'A table with 21 lettered objects, seen from above. The goal is to get the tennis ball L down from the high shelf N. Five moves reach it. A bent knitting needle hooks a cabinet open, the ruler from the cabinet pries a paint can open, the weight from the can breaks a block of ice, the rubber band from the ice ties two sticks into one long stick, and the long stick reaches the ball.',
      wide: true,
      steps: [
        { label: 'use(E, A)', say: 'The goal is “get L down from N.” The ball L lies on a shelf above the hand’s reach. The first move of the plan uses the bent knitting needle E on the cabinet A: its hooked end pulls the ring that opens the cabinet.' },
        { label: 'use(O, R)', say: 'The cabinet held a steel ruler, O. Its thin, flat, rigid tip pries the lid off the paint can R.' },
        { label: 'use(D, M)', say: 'The can held an iron weight, D. A blow with it breaks the block of ice M, which holds a rubber band.' },
        { label: 'tie(G, H, K)', say: 'The rubber band G ties the dowel H and the drumstick K into one long stick, W. This step makes a tool that was not on the table.' },
        { label: 'use(W, N)', say: 'The long stick W reaches the shelf N and brings the ball L down. Each move but the last freed or made what a later move needed.' },
      ],
      notes: [
        'The pictures are the renders the agent receives, from above, before each move of the plan. The agent gets only the letters. The objects are named here for the reader.',
        'The objects that the plan does not use are near-miss objects of its steps and objects on which a move has an effect that leads nowhere.',
      ],
    },
    atoms: {
      title: 'The eight atoms',
      description: 'Eight functions, each with the attribute that enables it: cut with a sharp edge, hook with a hooked end, poke with a long rigid shaft, heat with a hot or burning object, pound with a heavy and hard object, contain with a hollow and watertight object, tie with a long and flexible object, and pry with a thin, flat, rigid tip. For each function, a non-typical object that has the attribute and a similar-looking object that lacks it.',
      wide: true,
      notes: [
        'The pictures are close-ups from atom tables, as the agent receives them. The letter in a corner is the letter of the object on its table.',
        'Typical tools of the eight functions: knife and scissors, S-hook and hanger, stick and rod, lighter and candle, hammer and mallet, cup and bucket, rope and string, crowbar and screwdriver.',
      ],
    },
    turn: {
      title: 'What the agent receives on a table, and one turn',
      description: 'The four views of a composite table and the close-ups of its objects, each under a letter and with no name. The text gives the goal and three lists of letters. The agent answers use(E, A), a robot hand carries out the move, and the agent receives a result line and new pictures.',
      wide: true,
      steps: [
        { label: 'The table', say: 'The agent receives four views of the table and a close-up of every object under its letter. The text gives the goal and three lists of letters, and no name of any object.' },
        { label: 'A move', say: 'The agent answers use(E, A). A robot hand carries out the move in the simulator: it picks up E, brings its hooked end to the ring of the cabinet A, and pulls.' },
        { label: 'Its result', say: 'The agent is told that something changed and gets the updated lists and new pictures. The ruler O is now among the objects the hand can pick up.' },
      ],
      notes: [
        'The table is the composite table of five steps shown above. A composite table is shown at 1920 by 1440 pixels per picture.',
        'The weight D lies in the paint can R. The pictures mark its letter on the can, and no close-up shows it before the can is opened.',
      ],
    },
    pair: {
      title: 'A pair of tables of the atom level',
      description: 'Two tables that differ in one object, B. The goal of both is to get the ball F out of the sewn sack E. On the positive table B is a sharp stone flake, and the right move is use(B, E). On the negative table B is its counterpart, a smooth pebble, and the right answer is none().',
      steps: [
        { label: 'Positive table', say: 'The goal is “get F out of E.” E is a sack sewn shut, and F is a ball in it. B is a sharp stone flake, the only object on the table with a sharp edge. The right move is use(B, E).' },
        { label: 'Negative table', say: 'The same table with B replaced by its counterpart, a smooth pebble. No object has a sharp edge, nothing reaches the goal, and the right answer is none().' },
        { label: 'The pair', say: 'The two tables differ in one object. An agent that takes the typical tool fails both tables, an agent that always acts fails the negative table, and an agent that never acts fails the positive table.' },
      ],
      notes: [
        'The other six objects the hand can pick up are near-miss objects: a plastic toy knife (A), a putty knife (C), scissors with both blades snapped off (D), a metal spoon (G), a fishing line (H) and a plastic lid (I).',
      ],
    },
    pairs: {
      title: 'The atom level: positive tables, negative tables and pairs',
      description: 'For each of four models, the share of positive tables whose first move reaches the goal, the share of negative tables whose first move is none(), and the share of pairs with both tables right.',
      tabs: models,
      tabsLabel: 'The model whose numbers are shown',
      steps: [
        { label: 'Positive tables', say: 'On the positive tables, the first move of every model reaches the goal on 87.5% to 96.4% of the 192 tables. The working object is never a typical tool.' },
        { label: 'Negative tables', say: 'On the negative tables, the first move is none() on 42.3% to 75.3% of the 182 tables. On the others the model acts although no object has the attribute.' },
        { label: 'Pairs', say: 'Pairs with both tables right fall to between 38.5% and 70.9% of the 182 pairs. An agent that always acts and an agent that always answers none() both reach 0%.' },
      ],
      notes: ['The negative tables and the pairs are scored on 182 of the 192 pairs. The negative tables of poke are not scored.'],
    },
    moves: {
      title: 'Four models on one pair',
      description: 'The recorded moves of the four models on the pair of tables shown above. On the positive table every model answers use(B, E). On the negative table GPT-6.2 Astra answers none(), and the other three models first use near-miss objects on the sack and then answer none().',
      notes: [
        'The moves are the recorded plays of the pair of the function cut shown above. On the negative table B is a smooth pebble, D the scissors with both blades snapped off, C the putty knife, A the plastic toy knife and E the sack.',
        'A positive table is right when the first move reaches the goal, and a negative table when the first move is none().',
      ],
    },
    functions: {
      title: 'Negative tables right, by function',
      description: 'The share of negative tables whose first move is none(), for each function and each of four models. Every model is right on at least 25 of the 28 negative tables of contain and on at most 6 of the 18 of hook.',
      tabs: models,
      tabsLabel: 'The model whose numbers are shown',
      notes: ['Negative tables by function: 30 of cut, 18 of hook, 30 of heat, 30 of pound, 28 of contain, 28 of tie and 18 of pry. The negative tables of poke are not scored.'],
    },
    play: {
      title: 'One play of a composite table, read at two budgets',
      description: 'The eight moves of GPT-6.2 Astra on the composite table of five steps. The first three moves change nothing. The next five are the five plan steps, and the goal is reached at move 8. The play is not solved within the budget of k = 5 moves and is solved within twice k = 10 moves.',
      steps: [
        { label: 'The play', say: 'GPT-6.2 Astra plays the table of five steps shown above. After its first three moves nothing happens. Its next five moves are the five plan steps, and the goal is reached at move 8.' },
        { label: 'Budget k', say: 'Within the budget of k = 5 moves the table is not solved. At this budget every move must be a plan step.' },
        { label: 'Budget twice k', say: 'Within the budget of twice k = 10 moves the table is solved. The agent is not told a limit, so its first moves are the moves it would make under any limit, and one play gives the result at every budget.' },
      ],
      notes: ['A filled square is a plan step. An empty square is a move after which nothing happens.'],
    },
    budget: {
      title: 'Composite tables solved within a budget of moves',
      description: 'The share of the 210 composite tables that each of four models solves within a budget from k moves, the number of steps of a table, to twice k moves. Within k moves the models solve 9.1% to 34.3%, and within twice k moves 25.8% to 75.2%. The scripted agent that knows the plan solves 45.2% and 94.3%, the oracle 100%, and random moves 0.0% and 1.5%.',
      wide: true,
      tabs: models,
      tabsLabel: 'The model whose numbers are shown',
      steps: [
        { label: 'Four models', say: 'Within k moves the models solve 9.1% to 34.3% of the 210 composite tables, and with twice k moves 25.8% to 75.2%. GPT-6.2 Astra is the best model at every budget from k to twice k.' },
        { label: 'Knows the plan', say: 'The scripted agent that knows the plan and tries objects at random solves 45.2% of the tables within k moves and 94.3% within twice k. It is above every model at every budget.' },
        { label: 'Oracle and random moves', say: 'The oracle follows the plan and solves every table in exactly k moves. Random moves among those that change something solve 1.5% of the tables within twice k.' },
      ],
      notes: [
        'Each curve is the cubic through the values at k and at twice k that is closest to the values at the budgets between, as in the paper’s figure. The points are the measured values.',
        'Every table is played once by each model. Claude Opus 5.5 gave no answer on one table, which is left out of its counts. The scripted agents play every table 40 times.',
      ],
    },
    steps: {
      title: 'Composite tables solved, by the number of steps',
      description: 'The share of composite tables that each of four models solves within k moves and within twice k moves, for tables of two to eight steps. Within k moves the share falls from between 43.3% and 66.7% at two steps to between 0% and 3.3% at eight steps.',
      tabs: models,
      tabsLabel: 'The model whose numbers are shown',
      steps: [
        { label: 'Within k moves', say: 'The share solved within k moves falls from between 43.3% and 66.7% at two steps to between 0% and 3.3% at eight steps. The dashed line is the share the chosen model would reach if a table of k steps were k one-move tables, each right as often as its positive atom tables.' },
        { label: 'Within twice k moves', say: 'With twice k moves the models solve between 56.7% and 90.0% of the tables of two steps and between 3.3% and 63.3% of the tables of eight steps.' },
      ],
      notes: [
        'There are 30 tables for each number of steps, and 29 for Claude Opus 5.5 at seven steps.',
        'The dashed line is the share of positive atom tables whose first move reaches the goal, raised to the power k.',
      ],
    },
    stages: {
      title: 'Test-time continual learning: eight stages, the notes between them, and the same tables alone',
      description: 'A sequence of eight stages. Stage 1 holds five atom tables of the function cut. Each later stage holds up to five composite tables with one more step and one more function: pry, poke, pound, contain, tie, heat and hook. The agent rewrites its notes after every stage. Every table is also played alone, with no notes.',
      steps: [
        { label: 'Stage 1', say: 'Stage 1 holds five atom tables of one function. In this sequence the function is cut.' },
        { label: 'Notes', say: 'After a stage the agent writes its notes. They replace its earlier notes and are all that it has from before when the next stage starts. After stage 1 of this sequence, GPT-6.2 Astra wrote “Prefer a visibly sharp shard over a toy dagger or scissor handles with no blades.”' },
        { label: 'Stages 2 to 8', say: 'Stage i holds up to five composite tables of i steps, and each stage adds one function to the tables. After stage 2 the same model wrote “If the tool you need is itself enclosed, open its container first.”' },
        { label: 'Alone', say: 'Every table of a sequence is also played alone, with no notes, and scored at the same budget. The tables played with notes are compared with these plays.' },
      ],
      notes: ['The order of the functions is that of one of the eight sequences. Each function comes first in one sequence.'],
    },
    gain: {
      title: 'Test-time continual learning by stage: with notes and alone',
      description: 'For each of four models and each of three budgets, the share of the composite tables of a stage that the model solves with notes, the share of the same tables that it solves alone, and the gain, their difference in points, by stage. Every model solves more tables with notes than alone at each budget. Within k moves, GPT-6.2 Astra solves 53.8% of the 275 tables with notes and 46.9% of the same tables alone.',
      wide: true,
      tabs: models,
      tabsLabel: 'The model shown',
      steps: [
        { label: 'k moves', say: 'The tables of each stage solved within k moves, with notes and alone. At this budget every move must be a plan step. Over stages 2 to 8 the paired differences are 6.9 ± 2.7 points for GPT-6.2 Astra, 15.6 ± 2.9 for Claude Fable 5.2, 5.8 ± 2.9 for GPT-6.2 Sol and 3.6 ± 2.2 for Claude Opus 5.5.' },
        { label: '10 moves', say: 'The tables of each stage solved within 10 moves, with notes and alone. Over stages 2 to 8 the paired differences lie between 4.7 ± 2.5 and 16.4 ± 2.7 points.' },
        { label: 'Twice k moves', say: 'The tables of each stage solved within twice k moves, with notes and alone. Over stages 2 to 8 the paired differences are 9.5 ± 2.2 points for GPT-6.2 Astra, 14.2 ± 3.1 for Claude Fable 5.2, 20.1 ± 3.3 for Claude Opus 5.5 and 2.5 ± 2.9 for GPT-6.2 Sol. The gain is larger at stages 6 to 8 than at stages 2 to 5 for every model.' },
      ],
      notes: [
        'The line in the model’s colour is the share solved with notes, and the grey line the share of the same tables solved alone. The gain under a stage is the first minus the second, in points.',
        'Stage i holds the composite tables of i steps of the eight sequences, 36 to 40 tables. The three figures above the drawing are over stages 2 to 8, 275 tables.',
        'A difference is paired over tables, in points, with its standard error. Tables on which Claude Opus 5.5 gave no answer are left out of its counts.',
      ],
    },
    first: {
      title: 'Where the first move is a plan step',
      description: 'For each of four models, the share of states of the composite level at which the first move is a plan step, by the number of steps still to do, and the share of steps done at the first try, by where the tool of the step comes from. With one step to do the first move is a plan step at 86.6% to 94.9% of the states, and with eight steps to do at 10.0% to 50.0%.',
      tabs: models,
      tabsLabel: 'The model whose numbers are shown',
      steps: [
        { label: 'Steps still to do', say: 'The first move at a state is a plan step less often the more steps are still to do: at 86.6% to 94.9% of the states with one step to do, and at 10.0% to 50.0% with eight.' },
        { label: 'Where the tool comes from', say: 'A step is done at the first try in 59.9% to 86.6% of the cases when an earlier step has freed its tool, and in 24.2% to 60.9% when the tool has been on the table from the start.' },
      ],
      notes: [
        'A state is the table at its start or after a plan step. Every recorded play of a composite table is replayed on the object table, which reproduces the outcome of all 4,794 plays.',
        'A tool made by an earlier step comes from a step that makes a tool or is what an opened place leaves behind, such as a slat of an opened crate.',
      ],
    },
    open: {
      title: 'Steps left open when an unsolved table ends',
      description: 'For each of four models, the share of reached steps that are left open when an unsolved composite table ends, for steps that free an object and for steps that make a tool. A step that makes a tool is left open in 11.8% to 54.1% of the cases, a step that frees an object in 4.0% to 23.4%.',
      tabs: models,
      tabsLabel: 'The model whose numbers are shown',
      notes: [
        'A step is left open when the table ends with the step not done although its tool and its target are at hand. A step is reached when it is done or left open.',
        'A step makes a tool by changing one object (break, cut, flatten) or by tying two.',
      ],
    },
    shown: {
      title: 'What notes carry over to later tables',
      description: 'For each of four models and each of three budgets, the share of steps done at the first try with notes minus the share for the same steps alone, by what the earlier stages of the sequence have shown: the same step, the same tool for the function at another target, a new tool for a function shown before, or a function that is new at the stage. At the budget of twice k the gain is 18.4 to 31.8 points on the same step and −0.7 to +10.4 points on a new function.',
      tabs: models,
      tabsLabel: 'The model whose numbers are shown',
      steps: [
        { label: 'k moves', say: 'At the budget of k moves the gain on the same step is 15.7 to 23.2 points. For every model it is above the gain on a new tool for a function shown before.' },
        { label: '10 moves', say: 'At the budget of 10 moves the gain on the same step is 17.8 to 27.0 points, again above the gain on a new tool for every model.' },
        { label: 'Twice k moves', say: 'At the budget of twice k the share done at the first try rises by 18.4 to 31.8 points on the same step, by 8.0 to 23.9 points with the same tool at another target, by 5.1 to 14.3 points with a new tool, and by −0.7 to +10.4 points with a new function.' },
      ],
      notes: [
        'The same step has the same function, tool and target as a step of an earlier stage of the sequence. The values are differences in points between the tables played with notes and the same tables alone read at the same budget.',
      ],
    },
  },

  papers: [],
  references: [],
} as const satisfies Essay
