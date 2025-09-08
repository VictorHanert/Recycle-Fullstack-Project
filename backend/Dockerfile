FROM python:3.13-slim

# Install pip and poetry + fix python alias
RUN apt-get update && apt-get install -y python3-venv \
    && ln -s /usr/local/bin/python3 /usr/local/bin/python \
    && pip install --upgrade pip \
    && pip install poetry

# Set working directory
WORKDIR /code

# Copy poetry files
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry install --no-root --no-interaction --no-ansi

# Copy application code
COPY ./app ./app

# Expose port
EXPOSE 8000
