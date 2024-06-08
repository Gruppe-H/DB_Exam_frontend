import sys
import pandas as pd
import json

user_reviews_df = pd.read_csv('./ai/data/user_reviews.csv')
movie_info_df = pd.read_csv('./ai/data/movies_for_recommend.csv')

def recommend_movies(user_id, user_reviews_df, movie_info_df):
    user_cluster = user_reviews_df[user_reviews_df['user_id'] == user_id]['cluster'].values[0]
    recommended_movies = movie_info_df[movie_info_df['cluster'] == user_cluster]
    return recommended_movies

if __name__ == '__main__':
    user_id = sys.argv[1]
    recommended_movies = recommend_movies(user_id, user_reviews_df, movie_info_df)
    recommendations = recommended_movies['title_id'].tolist()
    print(json.dumps(recommendations))