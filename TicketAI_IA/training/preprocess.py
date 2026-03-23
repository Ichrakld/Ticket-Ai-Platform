import pandas as pd
import string
import unicodedata
import nltk
from nltk.corpus import stopwords

nltk.download('stopwords', quiet=True)

df = pd.read_csv('../data/tickets.csv')
stop_words = set(stopwords.words('french'))

def supprimer_accents(texte):
    return ''.join(
        c for c in unicodedata.normalize('NFD', texte)
        if unicodedata.category(c) != 'Mn'
    )

def nettoyer_texte(texte):
    texte = texte.lower()
    texte = texte.translate(str.maketrans('', '', string.punctuation + string.digits))
    # 1. Supprimer stopwords AVANT accents
    mots = texte.split()
    mots = [mot for mot in mots if mot not in stop_words]
    texte = ' '.join(mots)
    # 2. Supprimer accents APRÈS stopwords
    texte = supprimer_accents(texte)
    return texte

df['texte_nettoye'] = df['texte'].apply(nettoyer_texte)
df.to_csv('../data/tickets_clean.csv', index=False)
print("Nettoyage terminé !")
print(df[['texte', 'texte_nettoye']].head())