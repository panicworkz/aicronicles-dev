import sqlite3
import re

conn = sqlite3.connect('/opt/payload/payload.db')
cursor = conn.cursor()

# 1. Update posts
cursor.execute('UPDATE posts SET content_html = REPLACE(content_html, "https://fabelo.io/", "/") WHERE content_html LIKE "%https://fabelo.io/%"')
print("Updated posts fabelo.io links:", cursor.rowcount)

cursor.execute('UPDATE pages SET content_html = REPLACE(content_html, "https://fabelo.io/", "/") WHERE content_html LIKE "%https://fabelo.io/%"')
print("Updated pages fabelo.io links:", cursor.rowcount)

# 2. Update Ghost image paths
cursor.execute('SELECT id, content_html FROM posts WHERE content_html LIKE "%/content/images/%"')
rows = cursor.fetchall()
for post_id, html in rows:
    if html:
        new_html = re.sub(r'https?://fabelo\.io/content/images/\d+/\d+/([^"\'\s>]+)', r'/media/\1', html)
        new_html = re.sub(r'/content/images/\d+/\d+/([^"\'\s>]+)', r'/media/\1', new_html)
        cursor.execute('UPDATE posts SET content_html = ? WHERE id = ?', (new_html, post_id))
print("Updated image paths in posts:", len(rows))

conn.commit()
conn.close()
print("Link & Image fix completed.")
