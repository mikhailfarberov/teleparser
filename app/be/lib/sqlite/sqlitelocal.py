import sqlite3

class SqliteLocal():
    def __init__(self, file_name):
        self.conn = sqlite3.connect(file_name, isolation_level=None)
        self.conn.row_factory = self.dict_factory
    
    def dict_factory(self, cursor, row):
        d = {}
        for idx, col in enumerate(cursor.description):
            d[col[0]] = row[idx]
        return d

    def execute(self, query, values=None):
        cursor = self.conn.cursor()
        cursor.execute(query, values)
        return cursor.fetchall()
    