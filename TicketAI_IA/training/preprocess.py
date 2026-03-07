import pandas as pd
import string
import nltk
from nltk.corpus import stopwords

# download les stopwords français (une seule fois)
nltk.download('stopwords')

df = pd.read_csv('../data/tickets.csv')

# liste des stopwords français
stop_words = set(stopwords.words('french'))

# fonction de nettoyage


def nettoyer_texte(texte):
    # 1. minuscules
    texte = texte.lower()
    # 2. supprimer ponctuation et chiffres
    texte = texte.translate(str.maketrans(
        '', '', string.punctuation + string.digits))
    # 3. supprimer les stopwords
    mots = texte.split()
    mots = [mot for mot in mots if mot not in stop_words]
    return ' '.join(mots)


# appliquer le nettoyage
df['texte_nettoye'] = df['texte'].apply(nettoyer_texte)

df.to_csv('../data/tickets_clean.csv', index=False)

print("Nettoyage terminé ! Exemple :")
print(df[['texte', 'texte_nettoye']].head())
