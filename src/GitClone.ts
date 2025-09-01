import * as fs from "fs";
import { IProject } from "./IProject";
import simpleGit, { GitError } from "simple-git";
import { join } from 'path';
import { homedir } from 'os';

const filePath = process.env.FILENAME || "projects.json";

const args = process.argv.slice(2);
const rootDir = args[0];

if (args.length !== 1) {
  console.log('Give the main folder name')
  process.exit(1);
}


const path = join(homedir(), args[0], '/');

let projects: IProject[] = [];

fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err.message}`);
    return;
  }

  projects = JSON.parse(data);

  let dirs = new Set(
    projects.map((x) => path + x.groupName).filter((x) => x !== rootDir),
  );

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });

  const numberOfProjects = projects.length;
  let complete = 0;

  projects.forEach(async (project) => {
    console.log(`started cloning: ${project.name}`);
    try {
      const fullPath = path + project.groupName + "/" + project.name;

      if (project.groupName !== rootDir) {
        await simpleGit().clone(project.ssh, fullPath);
      } else {
        await simpleGit().clone(project.ssh, path + project.name);
      }
    } catch (err) {
      if (err instanceof GitError) {
        console.log(err.message);
      }
    }
    complete++;
    console.log(
      `Finished cloning: ${project.name} (${complete}/{${numberOfProjects})`,
    );
  });
});
