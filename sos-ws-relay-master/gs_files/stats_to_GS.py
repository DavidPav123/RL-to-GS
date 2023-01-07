from io import TextIOWrapper
from os import listdir
from os.path import getctime, getsize
from json import JSONDecodeError, load
from time import sleep

from google_sheets_push import update_sheet

# List of pages for google sheets to write to
pages_to_update: list[str] = [
    "Placeholder",  # DO NOT DELETE Placeholder so that program can be started before match
    "Sheet1",  # Change to page 1
    "Sheet2",  # Change to page 2
    "Sheet3",  # Change to page 3
    "Sheet4",  # Change to page 4
    "Sheet5",  # Change to page 5
    "Sheet6",  # Change to page 6
    "Sheet7",  # Change to page 7
]
# Variable for switching pages when new file is detected
current_page: int = 0
# Range to update in sheets change infor after
range_name: str = f"{pages_to_update[current_page]}!A1:Z26"
# List of files to check for changes
cur_file_name: str = ""
# Keep track of file contents to check for changes
cur_file_contents: str = ""


def get_latest_file() -> str:
    list_of_files: list[str] = listdir("sos-ws-relay-master\game_data")
    for i in range(len(list_of_files)):
        # append the path to the file name
        list_of_files[i] = f"sos-ws-relay-master\game_data\{list_of_files[i]}"

    latest_file: str = max(list_of_files, key=getctime)
    return latest_file


def update_page(page_list: list, current_page: int) -> str:
    return f"{page_list[current_page]}!A1:Z26"


def read_json_file(file_to_read: str) -> list[str]:
    final_list: list[str] = []
    try:
        f: TextIOWrapper = open(file_to_read)
        data: dict = load(f)
    except JSONDecodeError:
        print("Error")
        return final_list
    final_data: list[str] = []

    for i in data["data"]["game"]["teams"]:
        final_data.append(i["score"])

    final_list.append(final_data)

    for i in data["data"]["players"].keys():
        final_data: list[str] = []
        final_data.append(data["data"]["players"][i]["name"])
        final_data.append(data["data"]["players"][i]["score"])
        final_data.append(data["data"]["players"][i]["goals"])
        final_data.append(data["data"]["players"][i]["assists"])
        final_data.append(data["data"]["players"][i]["saves"])
        final_data.append(data["data"]["players"][i]["shots"])
        final_data.append(data["data"]["players"][i]["demos"])
        final_list.append(final_data)

    return final_list


if __name__ == "__main__":
    # get the latest file and read from it
    cur_file_name = get_latest_file()

    f: TextIOWrapper = open(cur_file_name)
    data: dict = load(f)

    while True:
        cur_file_tmp: str = get_latest_file()

        if cur_file_name != cur_file_tmp:
            cur_file_name = cur_file_tmp
            current_page += 1
            range_name = update_page(pages_to_update, current_page)

        try:
            new_f: TextIOWrapper = open(cur_file_name)
            new_data: dict = load(new_f)
        except JSONDecodeError:
            print("Did not update")
            continue

        if data != new_data:
            update_sheet(read_json_file(cur_file_name), range_name)
            data = new_data
            f = new_f
        else:
            print("No change in file")

        sleep(5)
