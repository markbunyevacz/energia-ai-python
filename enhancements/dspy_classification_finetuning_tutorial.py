"""
This file is an implementation of the "Classification Fine-tuning" DSPy tutorial.
It demonstrates how to fine-tune a small, local language model (Llama-3.2-1B)
for a classification task using a larger model (GPT-4o-mini) as a teacher.

**IMPORTANT: SETUP PREREQUISITES**

This tutorial requires a local GPU and a specific set of libraries for
fine-tuning and inference.

1.  **SGLang for Local Inference:**
    This tutorial uses SGLang to run the local model. Please follow the official
    installation instructions at https://docs.sglang.ai/start/install.html
    A typical command for a CUDA 12.4 environment is:
    `pip install "sglang[all]>=0.4.4.post3" --find-links https://flashinfer.ai/whl/cu124/torch2.5/flashinfer-python`

2.  **Fine-tuning Libraries:**
    Ensure you have the fine-tuning libraries installed. They are included
    in the requirements.txt file: torch, transformers==4.48.3, accelerate,
    trl, and peft.

3.  **Environment Variables (Optional but Recommended):**
    - `CUDA_VISIBLE_DEVICES`: Specify which GPU to use (e.g., "0").
    - `DSPY_FINETUNEDIR`: Set a directory to store fine-tuning checkpoints and data.
      If not set, DSPY_CACHEDIR or a default cache location will be used.
    - `HF_TOKEN`: Your Hugging Face token may be required to download the model.
"""

import os
import random
from typing import Literal

import dspy
import mlflow
from datasets import load_dataset
from dspy.clients.lm_local import LocalProvider
from dspy.datasets import DataLoader
from dspy.evaluate import Evaluate


def main():
    """Main function to run the classification fine-tuning tutorial."""
    # It's recommended to load API keys from a secure configuration.
    # The teacher model (GPT-4o-mini) requires an OpenAI API key.
    if not os.environ.get("OPENAI_API_KEY"):
        print("Please set the OPENAI_API_KEY environment variable for the teacher model.")
        return

    # --- 1. Load Dataset ---
    print("--- Loading Banking77 dataset ---")
    banking_dataset = load_dataset("PolyAI/banking77", split="train", trust_remote_code=True)
    CLASSES = banking_dataset.features['label'].names
    
    dl = DataLoader()
    raw_data = [
        dspy.Example(x, label=CLASSES[x.label]).with_inputs("text")
        for x in dl.from_huggingface("PolyAI/banking77", split="train", trust_remote_code=True)[:1000]
    ]
    random.Random(0).shuffle(raw_data)
    
    unlabeled_trainset = [dspy.Example(text=x.text).with_inputs("text") for x in raw_data[:500]]
    devset = raw_data[500:600]
    print(f"Loaded {len(unlabeled_trainset)} unlabeled training examples and {len(devset)} development examples.")
    print(f"Total classes: {len(CLASSES)}")

    # --- 2. Define DSPy Program ---
    classify = dspy.ChainOfThought(f"text -> label: Literal{CLASSES}")

    # --- 3. Set Up LMs and Programs ---
    print("\n--- Setting up Language Models ---")
    # Student: A small, local model to be fine-tuned.
    # Requires a local inference server like SGLang.
    student_lm_name = "meta-llama/Llama-3.2-1B-Instruct"
    student_lm = dspy.LM(
        model=f"openai/local:{student_lm_name}",
        provider=LocalProvider(),
        max_tokens=2000
    )

    # Teacher: A capable model to generate training data.
    teacher_lm = dspy.LM('openai/gpt-4o-mini', max_tokens=3000)

    student_classify = classify.deepcopy()
    student_classify.set_lm(student_lm)

    teacher_classify = classify.deepcopy()
    teacher_classify.set_lm(teacher_lm)

    # Enable experimental fine-tuning feature
    dspy.settings.experimental = True

    # --- 4. Bootstrapped Fine-tuning (without labels) ---
    print("\n--- Starting bootstrapped fine-tuning with unlabeled data ---")
    optimizer_unlabeled = dspy.BootstrapFinetune(num_threads=16)
    classify_ft_unlabeled = optimizer_unlabeled.compile(
        student_classify,
        teacher=teacher_classify,
        trainset=unlabeled_trainset
    )

    print("Launching fine-tuned model (unlabeled)...")
    classify_ft_unlabeled.get_lm().launch()

    # --- 5. Evaluate the Unlabeled Fine-tuned Program ---
    metric = (lambda x, y, trace=None: x.label == y.label)
    evaluate = Evaluate(devset=devset, metric=metric, display_progress=True, num_threads=16)

    print("\n--- Evaluating fine-tuned model (trained on unlabeled data) ---")
    unlabeled_score = evaluate(classify_ft_unlabeled)
    print(f"Score on dev set (unlabeled fine-tuning): {unlabeled_score:.1f}%")

    print("Killing server for unlabeled model.")
    classify_ft_unlabeled.get_lm().kill()

    # --- 6. Bootstrapped Fine-tuning (with labels via a metric) ---
    print("\n--- Starting bootstrapped fine-tuning with labeled data (via metric) ---")
    optimizer_labeled = dspy.BootstrapFinetune(num_threads=16, metric=metric)
    classify_ft_labeled = optimizer_labeled.compile(
        student_classify.deepcopy(),  # Use a fresh copy of the student
        teacher=teacher_classify,
        trainset=raw_data[:500] # This time, we pass examples with labels
    )

    print("Launching fine-tuned model (labeled)...")
    classify_ft_labeled.get_lm().launch()

    # --- 7. Evaluate the Labeled Fine-tuned Program ---
    print("\n--- Evaluating fine-tuned model (trained on labeled data) ---")
    labeled_score = evaluate(classify_ft_labeled)
    print(f"Score on dev set (labeled fine-tuning): {labeled_score:.1f}%")

    print("\n--- Evaluating original teacher model for comparison ---")
    teacher_score = evaluate(teacher_classify)
    print(f"Score of teacher model (gpt-4o-mini): {teacher_score:.1f}%")
    
    # --- 8. Log program to MLflow ---
    print("\n--- Logging final program to MLflow ---")
    with mlflow.start_run(run_name="banking77_classifier_finetuned"):
        model_info = mlflow.dspy.log_model(
            classify_ft_labeled,
            artifact_path="banking77_classifier",
        )
        print(f"Model saved in MLflow. URI: {model_info.model_uri}")

        # You can load the model back like this:
        # loaded_model = mlflow.dspy.load_model(model_info.model_uri)
        
    print("Killing server for labeled model.")
    classify_ft_labeled.get_lm().kill()
    print("\nTutorial complete.")


if __name__ == "__main__":
    main() 