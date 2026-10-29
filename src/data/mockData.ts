import { Course, LectureDeck, Message, RagChunk } from '../types';

export const MOCK_COURSES: Course[] = [
  {
    id: 'cs229',
    code: 'CS 229',
    name: 'Machine Learning & Optimization',
    instructor: 'Prof. Andrew Ng',
    decksCount: 2,
  },
  {
    id: 'phys101',
    code: 'PHYS 101',
    name: 'Classical Mechanics & Dynamics',
    instructor: 'Prof. Walter Lewin',
    decksCount: 1,
  },
  {
    id: 'bio204',
    code: 'BIO 204',
    name: 'Cellular & Molecular Biology',
    instructor: 'Dr. Evelyn Reed',
    decksCount: 1,
  },
];

export const MOCK_LECTURE_DECKS: LectureDeck[] = [
  {
    id: 'deck-cs229-l04',
    course: 'CS 229',
    title: 'Lecture 04: Gradient Descent & Loss Landscapes',
    filename: 'CS229_L04_Gradient_Descent.pdf',
    pages: 28,
    chunkCount: 64,
    uploadedAt: 'Yesterday, 4:15 PM',
    summary: 'Covers convex vs non-convex loss functions, gradient update rules, learning rate bounds (Lipschitz continuity), and oscillation phenomena.',
    topics: ['Gradient Descent', 'Learning Rate eta', 'Convexity', 'Lipschitz Constant', 'Oscillations'],
  },
  {
    id: 'deck-cs229-l05',
    course: 'CS 229',
    title: 'Lecture 05: Backpropagation & Computational Graphs',
    filename: 'CS229_L05_Backprop_Graphs.pdf',
    pages: 34,
    chunkCount: 82,
    uploadedAt: 'Oct 24, 2026',
    summary: 'Reverse-mode automatic differentiation, chain rule on multivariate nodes, Jacobian matrices, and vanishing gradients.',
    topics: ['Chain Rule', 'Backpropagation', 'Jacobians', 'Vanishing Gradients'],
  },
  {
    id: 'deck-phys101-l02',
    course: 'PHYS 101',
    title: 'Lecture 02: Conservative Forces & Potential Energy',
    filename: 'PHYS101_L02_Work_Energy.pdf',
    pages: 22,
    chunkCount: 48,
    uploadedAt: 'Oct 20, 2026',
    summary: 'Path independence of conservative vector fields, curl equals zero, gravitational and spring potential wells.',
    topics: ['Conservative Forces', 'Potential Wells', 'Work-Energy Theorem'],
  },
];

export const MOCK_RAG_CHUNKS: RagChunk[] = [
  {
    id: 'chunk-1',
    deckId: 'deck-cs229-l04',
    lectureTitle: 'Lecture 04: Gradient Descent & Loss Landscapes',
    slideNumber: 14,
    similarityScore: 0.94,
    keywords: ['learning rate', 'overshoot', 'step size', 'gradient magnitude', 'divergence'],
    snippet: 'Theorem 4.2 (Step Size Bounds): For an L-smooth convex function f, gradient descent theta_{t+1} = theta_t - eta * grad(f(theta_t)) converges monotonically if 0 < eta < 2/L. If eta > 2/L, successive steps overshoot the valley minimum, causing alternating oscillations or divergence to infinity.',
  },
  {
    id: 'chunk-2',
    deckId: 'deck-cs229-l04',
    lectureTitle: 'Lecture 04: Gradient Descent & Loss Landscapes',
    slideNumber: 15,
    similarityScore: 0.88,
    keywords: ['Lipschitz constant', 'curvature', 'Hessian matrix', 'eigenvalues'],
    snippet: 'Slide 15: The curvature is bounded by the maximum eigenvalue of the Hessian matrix H. Along high-curvature directions (large lambda_max), the gradient changes rapidly; a step size scaled for flat directions will aggressively overshoot steep valley walls.',
  },
  {
    id: 'chunk-3',
    deckId: 'deck-cs229-l04',
    lectureTitle: 'Lecture 04: Gradient Descent & Loss Landscapes',
    slideNumber: 21,
    similarityScore: 0.82,
    keywords: ['batch update', 'global minimum', 'strictly convex', 'quadratic loss'],
    snippet: 'Slide 21: For Mean Squared Error (MSE) linear regression J(theta) = 1/(2m) ||X*theta - y||^2, the Hessian is (1/m) X^T X, which is positive semi-definite. If X has full column rank, J is strictly convex with a unique global minimum.',
  },
  {
    id: 'chunk-4',
    deckId: 'deck-cs229-l05',
    lectureTitle: 'Lecture 05: Backpropagation & Computational Graphs',
    slideNumber: 9,
    similarityScore: 0.76,
    keywords: ['computational graph', 'reverse mode', 'chain rule'],
    snippet: 'Slide 9: In reverse-mode autodiff, the adjoint delta_i = dL/dx_i is propagated backwards from output to inputs. Each node multiplies incoming upstream gradients by its local partial derivative.',
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    timestamp: '10:14 AM',
    mode: 'socratic',
    text: 'Why does setting the learning rate too high cause gradient descent to diverge or oscillate back and forth?',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    timestamp: '10:14 AM',
    mode: 'socratic',
    socraticRatio: '80% Socratic · 20% Direct Guidance',
    text: `That is one of the most critical intuitions in optimization! Instead of just giving you the textbook definition, let's unpack what actually happens mathematically at each step.

Think about the update rule: $\\theta_{t+1} = \\theta_t - \\eta \\cdot \\nabla J(\\theta_t)$. The gradient vector tells you which direction is uphill, and its magnitude tells you how steep the slope is right where you are standing.

Notice what happens when you take a step scaled by $\\eta$: if $\\eta$ is moderate, you step downward toward the bottom of the valley. But what happens if the step length exceeds the entire width of the valley?

Take a look at the interactive loss landscape simulation below. Notice what happens when you slide $\\eta$ past $0.45$:`,
    ragSources: [MOCK_RAG_CHUNKS[0], MOCK_RAG_CHUNKS[1]],
    visuals: [
      {
        type: 'loss-diagram',
        lossDiagram: {
          defaultLearningRate: 0.52,
          initialSteps: 6,
        },
      },
      {
        type: 'slide-citation',
        slideCitation: {
          deckTitle: 'CS 229 · Lecture 04: Gradient Descent',
          slideNumber: 14,
          similarity: 0.94,
          topic: 'Theorem 4.2: Step Size & Lipschitz Upper Bound (η < 2/L)',
          excerpt: 'If η > 2/L, successive steps overshoot the valley minimum, causing alternating oscillations or divergence to infinity.',
        },
      },
      {
        type: 'mcq',
        mcq: {
          question: 'Socratic Check: If the gradient at your current position is very large, what happens if your learning rate η is also large?',
          options: [
            {
              id: 'opt-a',
              text: 'The step size η · ∇J will be small because they cancel out',
              isCorrect: false,
              feedback: 'Remember, step size is the product η × ||∇J||. Multiplying two large numbers yields an even larger jump, not a cancellation!',
            },
            {
              id: 'opt-b',
              text: 'The step overshoots the opposite valley wall where the slope is even steeper',
              isCorrect: true,
              feedback: 'Exactly right! Because the step size is massive, you leap clear across the minimum onto the opposite wall. Because that wall is even higher/steeper, the next gradient is larger, sparking explosive oscillation.',
            },
            {
              id: 'opt-c',
              text: 'Gradient descent immediately stops because the gradient vanishes',
              isCorrect: false,
              feedback: 'A vanishing gradient happens when slopes are nearly flat (∇J ≈ 0), not when gradients are large.',
            },
          ],
          socraticFollowUp: 'Follow-up challenge: Looking at Slide 14, what physical property of the loss function determines the maximum safe learning rate L?',
        },
      },
      {
        type: 'flashcard',
        flashcard: {
          front: 'What does the Lipschitz Constant L represent intuitively in gradient descent?',
          back: 'L measures the maximum rate at which the gradient can change (the maximum curvature or steepest second derivative). A higher L means sharper curves, requiring a strictly smaller learning rate (η < 2/L).',
          context: 'Lecture 04 · Slide 14 & 15',
          slideRef: 'Slide 14',
        },
      },
    ],
  },
];
