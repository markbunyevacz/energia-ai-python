"""
This file is an implementation of the "Fine-tuning Agents" DSPy tutorial.
It demonstrates how to fine-tune a smaller language model (gpt-4o-mini)
by using a larger model (gpt-4o) as a teacher on the AlfWorld dataset.

NOTE: Before running, you must download the AlfWorld dataset by running:
`alfworld-download`
in your terminal.
"""

import os
import dspy
from dspy.datasets.alfworld import AlfWorld
from dspy.evaluate import Evaluate

class Agent(dspy.Module):
    """A simple ReAct agent for the AlfWorld environment."""
    def __init__(self, max_iters=50, verbose=False):
        super().__init__()
        self.max_iters = max_iters
        self.verbose = verbose
        self.react = dspy.Predict("task, trajectory, possible_actions: list[str] -> action")

    def forward(self, idx):
        with alfworld.POOL.session() as env:
            trajectory = []
            task, info = env.init(idx)
            if self.verbose:
                print(f"Task: {task}")

            for _ in range(self.max_iters):
                trajectory_ = "\n".join(trajectory)
                possible_actions = info["admissible_commands"][0] + ["think: ${...thoughts...}"]
                prediction = self.react(task=task, trajectory=trajectory_, possible_actions=possible_actions)
                trajectory.append(f"> {prediction.action}")

                if prediction.action.startswith("think:"):
                    trajectory.append("OK.")
                    continue

                obs, reward, done, info = env.step(prediction.action)
                obs, reward, done = obs[0], reward[0], done[0]
                trajectory.append(obs)

                if self.verbose:
                    print("\n".join(trajectory[-2:]))

                if done:
                    break

        # The tutorial had an assert here, but returning a Prediction is more standard.
        success = int(info["won"][0])
        return dspy.Prediction(trajectory=trajectory, success=success)


def main():
    """Main function to run the AlfWorld agent fine-tuning tutorial."""
    # It's recommended to load API keys from a secure configuration,
    # not from environment variables directly in the code.
    # For example, using the project's settings management:
    # from src.energia_ai.config.settings import settings
    # os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
    if not os.environ.get("OPENAI_API_KEY"):
        print("Please set the OPENAI_API_KEY environment variable to run this tutorial.")
        return
        
    # Set up language models
    # The tutorial uses a powerful model (gpt-4o) to teach a smaller, cheaper one (gpt-4o-mini).
    # Fine-tuning support is provider-specific. While this works well with OpenAI,
    # other providers like Anthropic may have different procedures for model customization.
    gpt4o_mini = dspy.LM('gpt-4o-mini-2024-07-18')
    gpt4o = dspy.LM('openai/gpt-4o')
    dspy.configure(experimental=True)

    # Load the dataset
    print("Loading AlfWorld dataset...")
    alfworld = AlfWorld()
    trainset, devset = alfworld.trainset[:200], alfworld.devset[-200:]
    print(f"Loaded {len(trainset)} training and {len(devset)} development examples.")

    # Define the evaluation metric
    metric = lambda x, y, trace=None: y.success
    evaluate = Evaluate(devset=devset, metric=metric, display_progress=True, num_threads=16)

    # --- Zero-shot evaluation ---
    print("\n--- Evaluating zero-shot gpt-4o ---")
    agent_4o = Agent()
    agent_4o.set_lm(gpt4o)
    agent_4o_score = evaluate(agent_4o)
    print(f"Zero-shot gpt-4o success rate: {agent_4o_score:.1f}%")
    
    print("\n--- Evaluating zero-shot gpt-4o-mini ---")
    agent_4o_mini = Agent()
    agent_4o_mini.set_lm(gpt4o_mini)
    agent_4o_mini_score = evaluate(agent_4o_mini)
    print(f"Zero-shot gpt-4o-mini success rate: {agent_4o_mini_score:.1f}%")

    # --- Prompt-optimizing the teacher (GPT-4o) ---
    print("\n--- Optimizing prompts for gpt-4o (teacher) ---")
    optimizer = dspy.MIPROv2(metric=metric, auto="light", num_threads=16, prompt_model=gpt4o)
    config = dict(max_bootstrapped_demos=1, max_labeled_demos=0, minibatch_size=40)
    optimized_4o = optimizer.compile(agent_4o, trainset=trainset, **config, requires_permission_to_run=False)
    
    # --- Fine-tuning the student (GPT-4o-mini) ---
    print("\n--- Fine-tuning gpt-4o-mini (student) ---")
    student_4o_mini = optimized_4o.deepcopy()
    student_4o_mini.set_lm(gpt4o_mini)
    
    finetune_optimizer = dspy.BootstrapFinetune(metric=metric, num_threads=16)
    finetuned_4o_mini = finetune_optimizer.compile(student_4o_mini, teacher=optimized_4o, trainset=trainset)

    # --- Evaluating the fine-tuned agent ---
    print("\n--- Evaluating fine-tuned gpt-4o-mini ---")
    finetuned_score = evaluate(finetuned_4o_mini)
    print(f"Fine-tuned gpt-4o-mini success rate: {finetuned_score:.1f}%")

    # --- Saving the agent ---
    save_path = 'finetuned_4o_mini_alfworld.pkl'
    print(f"\nSaving fine-tuned agent to {save_path}")
    finetuned_4o_mini.save(save_path)

    # --- Loading and using the agent ---
    print(f"\n--- Loading agent from {save_path} and running on one example ---")
    loaded_agent = Agent()
    loaded_agent.load(save_path)
    loaded_agent.verbose = True
    loaded_agent(**devset[0].inputs())


if __name__ == "__main__":
    # Note: multiprocess can have issues on some platforms without this.
    try:
        from multiprocessing import set_start_method
        set_start_method("fork")
    except RuntimeError:
        pass
    main() 