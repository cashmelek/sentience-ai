# Sentience AI - Unsloth ile Lokal Fine-Tuning Scripti
# Gereksinim: pip install unsloth trl torch datasets

import os
from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

max_seq_length = 2048
dtype = None # Auto detect: Float16 for Tesla T4/V100, Bfloat16 for Ampere/Ada/Hopper
load_in_4bit = True # 4bit quantization ile 8GB-12GB VRAM yeterli

# 1. Temel Modeli Yukle
print("1. Temel model yukleniyor...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Meta-Llama-3.1-8B-Instruct",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# 2. LoRA / PEFT Parametreleri
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)

# 3. Veri Setini Yukle (Alpaca Formati)
dataset_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "alpaca_format.json")
dataset = load_dataset("json", data_files=dataset_path, split="train")

alpaca_prompt = """Aşağıda bir talimat ve girdi bulunmaktadır. Talebi karşılayan uygun bir yanıt yazın.

### Talimat:
{}

### Girdi:
{}

### Yanıt:
{}"""

def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs       = examples["input"]
    outputs      = examples["output"]
    texts = []
    for instruction, input_text, output in zip(instructions, inputs, outputs):
        text = alpaca_prompt.format(instruction, input_text, output) + tokenizer.eos_token
        texts.append(text)
    return { "text" : texts }

dataset = dataset.map(formatting_prompts_func, batched = True)

# 4. Egitim (SFT)
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60,
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

print("2. Egitim basliyor...")
trainer_stats = trainer.train()

# 5. Modeli Kaydet (LoRA Adapter ve Ollama GGUF)
print("3. Model kaydediliyor...")
model.save_pretrained_merged("sentience_lora_model", tokenizer, save_method = "lora")

# GGUF olarak dogrudan Ollama icin export (Opsiyonel)
# model.save_pretrained_gguf("sentience_gguf_model", tokenizer, quantization_method = "q4_k_m")

print("Egitim tamamlandi! 'sentience_lora_model' klasorune kaydedildi.")
