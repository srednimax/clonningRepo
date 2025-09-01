import * as fs from "fs";
import { IProject } from "./IProject";
import simpleGit, { FetchResult, GitError } from "simple-git";

const filePath = process.env.FILENAME || "projects.json";
const path = "./home/maks/repos";
const rootDir = "communicate";

let projects: IProject[] = [];

fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err.message}`);
    return;
  }

  projects = JSON.parse(data);

  const numberOfProjects = projects.length;
  let complete = 0;

  projects.forEach(async (project) => {
    console.log(`started fetching: ${project.name}`);
    try {
      const fullPath = path + project.groupName + "/" + project.name;
      if (project.groupName !== rootDir) {
        await simpleGit(fullPath).fetch().pull();
      } else {
        await simpleGit(path + project.name).fetch();
      }
    } catch (err) {
      if (err instanceof GitError) {
        console.log(err.message);
      }
    }
    complete++;
    console.log(
      `Finished fetching: ${project.name} (${complete}/{${numberOfProjects})`,
    );
  });
});
