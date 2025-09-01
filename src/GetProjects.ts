import { CondensedProjectSchema, Gitlab } from "@gitbeaker/rest";
import { IProject } from "./IProject";
import * as fs from "fs";

const token = process.env.CI_PACKAGES_PASSWORD;
const filePath = process.env.FILENAME || "projects.json";
const args =  process.argv.slice(2);

if (args.length !== 1) {
  console.log('Group Id is not provided')
  process.exit(1);
}

const communicateGroupId = Number(args[0]);

if (!token) {
  console.log("Token not found");
  process.exit(1);
}
const api = new Gitlab({
  token: token,
});
let groupsId: number[];
const groups = await api.Groups.allSubgroups(communicateGroupId, {
  statistics: false,
});

groupsId = groups.map((x) => x.id);
groupsId.push(communicateGroupId);

let projectPromises: Promise<CondensedProjectSchema[]>[] = [];
groupsId.forEach(async (id) => {
  projectPromises.push(
    api.Groups.allProjects(id, {
      simple: true,
      archived: false,
      withShared: false,
    }),
  );
});

let projectsWithGroups = (await Promise.all(projectPromises)).flatMap((x) => x);
let projects: IProject[] = [];

projects = projectsWithGroups.map<IProject>((project) => {
  return {
    id: project.id,
    name: project.name.replace(/ /g, '_'),
    path: project.path_with_namespace as string,
    ssh: project.ssh_url_to_repo as string,
    defaultBranch: project.default_branch as string,
    groupName: (project.namespace as { path: string }).path.replace(/ /g, '_') as string,
  };
});

console.log("Starting saving");
fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));
console.log("finished");

process.exit(1);
