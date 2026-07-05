from autogen_ext.models.openai import OpenAIChatCompletionClient

import config


def get_model_client(model: str) -> OpenAIChatCompletionClient:
    return OpenAIChatCompletionClient(
        model=model,
        base_url=config.GEMINI_BASE_URL,
        api_key=config.GEMINI_API_KEY,
        model_info={
            "vision": False,
            "function_calling": True,
            "json_output": True,
            "family": "unknown",
            "structured_output": True,
        },
    )
