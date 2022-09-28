import os
import json
import nltk
import re
import torch
from itertools import chain
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-mpnet-base-v2')

datasetPath = './dataset-en'
files = os.listdir(datasetPath)

games = []

for file in files:
    if not file.endswith(".json"):
        continue
    
    filePath = datasetPath + '/' + file
    # Opening JSON file
    f = open(filePath)
    data = json.load(f)

    gameData = {
        'game': data[0]['game'],
        'reviews': [],
        'reviewEmbeddings': []
    }

    for review in data:
        if 'text' in review:
            tokens = nltk.sent_tokenize(review['text'])
            cleanedSentences = []
            for sentence in tokens:
                cleanSentence = re.sub("[\n\r\t]", "", sentence)
                cleanSentence = re.sub("(\s\s+)", "", cleanSentence)
                cleanSentence = re.sub(u'\xa0', " ", cleanSentence)
                cleanedSentences.append(cleanSentence)
            gameData['reviews'].append(cleanedSentences)
            
            flatSentences = list(chain(*cleanedSentences))
            embeddings = model.encode(flatSentences, convert_to_tensor=True)
            gameData['reviewEmbeddings'].append(embeddings)

    games.append(gameData)

for gameData in games:
    print(f"Processing {gameData['game']}")
    allSentences = []
    for review in gameData['reviews']:
        allSentences.append(review)

    flatSentences = list(chain(*allSentences))
    print(f"Total length: {len(flatSentences)}")
    # print(flatSentences)
    embeddings = model.encode(flatSentences, convert_to_tensor=True)
    gameData['embeddings'] = embeddings
    gameData['sentenceCount'] = len(flatSentences)

for index, gameData in enumerate(games):
    currentGameEmbeddings = gameData['embeddings']
    if index + 1 < len(games):
        for nextIndex in range(index + 1, len(games)):
            gameDataNext = games[nextIndex]
            nextEmbeddings = gameDataNext['embeddings']
            cosine_scores = util.cos_sim(currentGameEmbeddings, nextEmbeddings)
            print(f"Comparing {gameData['game']} with {gameDataNext['game']}:")
            mean_score = torch.mean(cosine_scores)
            print(f"Score: {mean_score}")

