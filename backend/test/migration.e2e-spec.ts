import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

describe('academic migration', () => {
  it('preserves existing records, maps roles, and creates undated legacy certificates from lesson evidence', () => {
    const directory = mkdtempSync(join(tmpdir(), 'lets-learn-migration-'));
    try {
      const result = execFileSync('python3', ['-c', `
import sqlite3,glob,sys,json
c=sqlite3.connect(sys.argv[1]); files=sorted(glob.glob(sys.argv[2]+'/*/migration.sql'))
organization_migration=next(i for i,f in enumerate(files) if 'organization_modules' in f)
for f in files[:organization_migration]: c.executescript(open(f).read())
c.executescript('''
INSERT INTO User(id,username,email,password,role,updatedAt) VALUES ('u','student','s@example.test','hash','student',CURRENT_TIMESTAMP),('a','admin','a@example.test','hash','admin',CURRENT_TIMESTAMP);
INSERT INTO Course(id,title,price,authorId,updatedAt) VALUES ('c','Existing course',0,'a',CURRENT_TIMESTAMP);
INSERT INTO Lesson(id,title,"order",courseId,updatedAt) VALUES ('l','Existing lesson',1,'c',CURRENT_TIMESTAMP);
INSERT INTO Enrollment(id,userId,courseId,progress,updatedAt) VALUES ('e','u','c',100,CURRENT_TIMESTAMP),('incomplete','a','c',100,CURRENT_TIMESTAMP);
INSERT INTO VideoProgress(id,userId,lessonId,courseId,completed,watchTime,updatedAt) VALUES ('v','u','l','c',1,200,CURRENT_TIMESTAMP);
''')
for f in files[organization_migration:]: c.executescript(open(f).read())
print(json.dumps({'counts':[c.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in ['User','Course','Lesson','Enrollment','VideoProgress']], 'members':c.execute('SELECT userId,role FROM Membership ORDER BY userId').fetchall(), 'certificates':c.execute('SELECT userId,issuedAt,legacy FROM Certificate').fetchall(), 'foreignKeys':c.execute('PRAGMA foreign_key_check').fetchall()}))
`, join(directory, 'test.db'), resolve(__dirname, '../prisma/migrations')], { encoding: 'utf8' });
      const data = JSON.parse(result); expect(data.counts).toEqual([2, 1, 1, 2, 1]); expect(data.members).toEqual([['a', 'admin'], ['u', 'learner']]); expect(data.certificates).toEqual([['u', null, 1]]); expect(data.foreignKeys).toEqual([]);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
