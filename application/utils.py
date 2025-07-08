from jinja2 import Template

def roles_list(roles):
    role_list=[]
    for role in roles_list:
        roles_list.append(role.name)
    return role_list


def format_report(html_template, data):
    with open(html_template) as file:
        template=Template.render(data=data)
        return template.render(data=data)