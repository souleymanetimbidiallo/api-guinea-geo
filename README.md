# API Documentation - Guinée Locations

## Overview

Cette API fournit des informations sur les régions, préfectures, sous-préfectures, communes et quartiers de la Guinée. Elle est construite avec NodeJS, utilisant le framework Express et une base de données MongoDB.

## Base URL

`http://api.guineelocations.com/v1`

## Authentication

Pour l'instant, l'API ne requiert pas d'authentification.

## Endpoints

### Régions

- **Liste des régions**
  - **Description**: Retourne toutes les régions de la Guinée.
  - **URL**: `/regions`
  - **Method**: `GET`
  - **Response**:
    ```json
    [
        {
            "_id": "660562b45fba1720e0cd3ea8",
            "name": "Boké",
            "zone": "Ouest",
            "population": 1081445,
            "area": 31186,
            "__v": 0
        },
        {
            "_id": "660562b45fba1720e0cd3ea9",
            "name": "Conakry",
            "zone": "Ouest",
            "population": 1667864,
            "area": 450,
            "__v": 0
        },
        ...
    ]
    ```

### Préfectures

- **Liste des préfectures par région**
  - **Description**: Retourne les préfectures.
  - **URL**: `/prefectures`
  - **Method**: `GET`
  - **Response**:
    ```json
    [
        {
            "_id": "66056d4b0b7fa018fe3c2a55",
            "name": "Télimélé",
            "population": 312458,
            "area": 8374,
            "region": "660562b45fba1720e0cd3eac",
            "__v": 0
        },
        {
            "_id": "66056d4b0b7fa018fe3c2a58",
            "name": "Labé",
            "population": 436836,
            "area": 4440,
            "region": "660562b45fba1720e0cd3ead",
            "__v": 0
        },
        ...
    ]
    ```

### Sous-Préfectures

- **Liste des sous-préfectures par préfecture**
  - **Description**: Retourne les sous-préfectures.
  - **URL**: `/sous-prefectures/`
  - **Method**: `GET`
  - **Response**:
    ```json
    [
        {
            "_id": "66058b4768b45b9a3cc226ac",
            "name": "Koulé",
            "prefecture": "66056d4c0b7fa018fe3c2a8b",
            "__v": 0
        },
        {
            "_id": "66058b4768b45b9a3cc226af",
            "name": "N'Zérékoré-Centre (urban)",
            "prefecture": "66056d4c0b7fa018fe3c2a8b",
            "__v": 0
        },
        ...
    ]
    ```

### Communes

- **Liste des communes par sous-préfecture**
  - **Description**: Retourne les communes.
  - **URL**: `/communes`
  - **Method**: `GET`
  - **Response**:
    ```json
    [
        {
            "_id": "6605a355eec283a688c60f01",
            "name": "Dixinn",
            "region": {
            "_id": "660562b45fba1720e0cd3ea9",
            "name": "Conakry",
            "zone": "Ouest",
            "population": 1667864,
            "area": 450,
            "__v": 0
            },
            "__v": 0
        },
        {
            "_id": "6605a355eec283a688c60f04",
            "name": "Kaloum",
            "region": {
            "_id": "660562b45fba1720e0cd3ea9",
            "name": "Conakry",
            "zone": "Ouest",
            "population": 1667864,
            "area": 450,
            "__v": 0
            },
            "__v": 0
        },
    ...
    ]
    ```

### Quartiers

- **Liste des quartiers par commune**
  - **Description**: Retourne les quartiers.
  - **URL**: `/quartiers`
  - **Method**: `GET`
  - **Response**:
    ```json
    [
        {
            "name": "Almamya",
            "commune": {
            "_id": "6605a355eec283a688c60f04",
            "name": "Kaloum",
            "region": "660562b45fba1720e0cd3ea9",
            "__v": 0
            }
        },
        {
            "name": "Camayenne",
            "commune": {
            "_id": "6605a355eec283a688c60f01",
            "name": "Dixinn",
            "region": "660562b45fba1720e0cd3ea9",
            "__v": 0
            }
        },
        ...
    ]
    ```

## Error Handling

Les erreurs sont renvoyées en tant qu'objets JSON avec au moins deux clés: `message` et `code`. Exemple d'erreur:

```json
{
  "message": "Resource not found",
  "code": 404
}
