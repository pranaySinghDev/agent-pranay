# Agent Pranay

Agent Pranay is a web application that leverages local browser-based language models from WebLLM to answer questions about my resume. This project is part of my portfolio and showcases the integration of modern AI technologies with personal data to provide a seamless user experience.

## Installation

To get started with the project, follow these steps:

1. **Clone the repository:**
   ```bash
   cd agent-pranay
   ```

2. **Install dependencies:**
   ```bash
   yarn
   ```

3. **Start the development server:**
   ```bash
   yarn dev
   ```

## Supported Models

Agent Pranay supports the following language models:

| Model                     | Model Size |
|---------------------------|------------|
| TinyLlama-1.1B-Chat-v0.4-q4f32_1-1k | 600MB      |
| Llama-3-8B-Instruct-q4f16_1        | 4.3GB      |
| Phi1.5-q4f16_1-1k                   | 1.2GB      |
| Mistral-7B-Instruct-v0.2-q4f16_1   | 4GB        |

## Usage

Once the development server is running, you can interact with the application via your web browser. The application will load the selected language model and provide an interface to ask questions about my resume.

## Inspiration

This project was inspired by the following repositories:

- [WebLLM](https://github.com/mlc-ai/web-llm)
- [Secret Llama](https://github.com/abi/secret-llama)



